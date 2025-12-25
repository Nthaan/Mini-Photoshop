# backend/main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
from typing import Optional

app = FastAPI()

# Allow local dev from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # di production ganti ke domain frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def img_to_base64(img) -> str:
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def read_imagefile(file_bytes: bytes):
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@app.post("/process")
async def process_image(
    file: UploadFile = File(...),
    brightness: Optional[int] = Form(0),
    contrast: Optional[float] = Form(1.0),
    blur: Optional[int] = Form(1),
    invert: Optional[bool] = Form(False),
    grayscale: Optional[bool] = Form(False),
    edge: Optional[bool] = Form(False),
    rotate: Optional[int] = Form(0),  
):

    data = await file.read()
    img = read_imagefile(data)
    if img is None:
        return {"error": "Invalid image"}

    # Apply brightness (HSV V channel)
    if brightness != 0:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v = np.clip(v.astype(np.int32) + int(brightness), 0, 255).astype(np.uint8)
        hsv = cv2.merge([h, s, v])
        img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    # Apply contrast
    if contrast != 1.0:
        img = cv2.convertScaleAbs(img, alpha=float(contrast), beta=0)

    # Apply blur (kernel must be odd)
    if blur and int(blur) > 1:
        kv = int(blur)
        if kv % 2 == 0:
            kv += 1
        img = cv2.GaussianBlur(img, (kv, kv), 0)

    # Grayscale
    if grayscale:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    # Invert
    if invert:
        img = cv2.bitwise_not(img)

    # Edge detection (Canny) — produce grayscale-looking edges
    if edge:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        img = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    # Rotate (90, 180, 270)
    if rotate == 90:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    elif rotate == 180:
        img = cv2.rotate(img, cv2.ROTATE_180)
    elif rotate == 270:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

    b64 = img_to_base64(img)
    return {"image": b64}

