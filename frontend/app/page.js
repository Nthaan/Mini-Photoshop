"use client";

import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Droplet,
  Scan,
  RotateCw,
  RotateCcw,
  FlipVertical,
  Sun,
  RefreshCcw,
  Download,
  Blend,
  AlertCircle,
} from "lucide-react";

export default function Home() {
  const [original, setOriginal] = useState(null);
  const [processed, setProcessed] = useState(null);
  const [file, setFile] = useState(null);

  const [brightness, setBrightness] = useState(0);
  const [notification, setNotification] = useState("");

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  };

  const handleUpload = (e) => {
    const img = e.target.files[0];
    if (!img) return;
    setFile(img);
    setOriginal(URL.createObjectURL(img));
    setProcessed(null);
    setBrightness(0);
  };

  const sendToBackend = async (operation = "none", rotateValue = 0) => {
    if (!file) {
      notify("Please upload an image first");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("brightness", brightness);
    form.append("contrast", 1.0);
    form.append("blur", operation === "blur" ? 9 : 1);
    form.append("invert", operation === "invert");
    form.append("grayscale", operation === "grayscale");
    form.append("edge", operation === "edge");
    form.append("rotate", rotateValue);

    const res = await fetch("http://127.0.0.1:8000/process", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setProcessed("data:image/jpeg;base64," + data.image);
  };

  // ✅ DEBOUNCE BRIGHTNESS (BUG FIX)
  useEffect(() => {
    if (!file) return;

    const timeout = setTimeout(() => {
      sendToBackend("none");
    }, 300);

    return () => clearTimeout(timeout);
  }, [brightness]);

  const resetImage = async () => {
    if (!file) {
      notify("No image to reset");
      return;
    }

    setBrightness(0);

    const form = new FormData();
    form.append("file", file);
    form.append("brightness", 0);
    form.append("contrast", 1.0);
    form.append("blur", 1);
    form.append("invert", false);
    form.append("grayscale", false);
    form.append("edge", false);
    form.append("rotate", 0);

    const res = await fetch("http://127.0.0.1:8000/process", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setProcessed("data:image/jpeg;base64," + data.image);
  };

  const downloadImage = () => {
    if (!processed) {
      notify("No processed image to download");
      return;
    }

    const link = document.createElement("a");
    link.href = processed;
    link.download = "mini-photoshop-result.jpg";
    link.click();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('/Bladewp.png')" }}
      />
      <div className="absolute inset-0 backdrop-blur-xl bg-black/50" />

      {/* TOAST */}
      {notification && (
        <div className="toast">
          <AlertCircle size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* CONTENT */}
      <div className="relative z-10 p-10 max-w-6xl mx-auto text-slate-100">
        <h1 className="text-4xl font-bold mb-10 tracking-tight">
          Mini Photoshop
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* ORIGINAL */}
          <div className="glass">
            <h2 className="section-title">Original</h2>

            <label className="upload-box">
              <ImageIcon size={20} />
              <span>Select Image</span>
              <input type="file" onChange={handleUpload} hidden />
            </label>

            {original && <img src={original} className="preview-img" />}

            {/* TOOLS */}
            <h3 className="sub-title">Tools</h3>
            <div className="tool-grid">
              <Tool icon={<Blend size={18} />} label="Grayscale" onClick={() => sendToBackend("grayscale")} />
              <Tool icon={<Sun size={18} />} label="Invert" onClick={() => sendToBackend("invert")} />
              <Tool icon={<Scan size={18} />} label="Edge" onClick={() => sendToBackend("edge")} />
              <Tool icon={<Droplet size={18} />} label="Blur" onClick={() => sendToBackend("blur")} />
            </div>

            {/* BRIGHTNESS */}
            <h3 className="sub-title">Brightness</h3>
            <div className="slider-box">
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
              />
              <span>{brightness}</span>
            </div>

            {/* ROTATE */}
            <h3 className="sub-title">Rotate</h3>
            <div className="tool-grid">
              <Tool icon={<RotateCw size={18} />} label="90°" onClick={() => sendToBackend("none", 90)} />
              <Tool icon={<FlipVertical size={18} />} label="180°" onClick={() => sendToBackend("none", 180)} />
              <Tool icon={<RotateCcw size={18} />} label="270°" onClick={() => sendToBackend("none", 270)} />
            </div>

            {/* ACTIONS */}
            <h3 className="sub-title">Actions</h3>
            <div className="tool-grid">
              <Tool icon={<RefreshCcw size={18} />} label="Reset" onClick={resetImage} />
              <Tool icon={<Download size={18} />} label="Download" onClick={downloadImage} />
            </div>
          </div>

          {/* RESULT */}
          <div className="glass">
            <h2 className="section-title">Result</h2>
            {processed ? (
              <img src={processed} className="preview-img" />
            ) : (
              <p className="text-slate-300 italic">No processed image yet</p>
            )}
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 14px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          z-index: 50;
        }

        .glass {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        }

        .upload-box {
          display: flex;
          gap: 10px;
          padding: 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.12);
          cursor: pointer;
        }

        .tool-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tool-btn {
          display: flex;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.18);
        }

        .slider-box {
          display: flex;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.12);
        }

        .slider-box input {
          flex: 1;
        }

        .preview-img {
          margin-top: 16px;
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.35);
        }
      `}</style>
    </div>
  );
}

function Tool({ icon, label, onClick }) {
  return (
    <button className="tool-btn" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
