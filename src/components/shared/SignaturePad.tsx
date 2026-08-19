import React, { useRef, useState, useEffect } from "react";
import { Pencil, Upload, Trash2 } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export function SignaturePad({ value, onChange }) {
  const [mode, setMode] = useState("draw"); // "draw" | "upload"
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = colors.gray[900];
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing.current = true;
    hasDrawn.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasDrawn.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    hasDrawn.current = false;
    onChange(null);
  }

  function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  function switchMode(m) {
    setMode(m);
    handleClear();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => switchMode("draw")} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: radius.full,
          border: "1px solid " + (mode === "draw" ? palette.primary.solid : colors.gray[200]),
          background: mode === "draw" ? palette.primary[50] : colors.white,
          color: mode === "draw" ? palette.primary.text : colors.gray[600],
          fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: font,
        }}>
          <Pencil size={13} /> Dessiner
        </button>
        <button type="button" onClick={() => switchMode("upload")} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: radius.full,
          border: "1px solid " + (mode === "upload" ? palette.primary.solid : colors.gray[200]),
          background: mode === "upload" ? palette.primary[50] : colors.white,
          color: mode === "upload" ? palette.primary.text : colors.gray[600],
          fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: font,
        }}>
          <Upload size={13} /> Importer une image
        </button>
      </div>

      {mode === "draw" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <canvas
            ref={canvasRef}
            width={500}
            height={180}
            style={{
              width: "100%", maxWidth: 400, height: 150, borderRadius: radius.md,
              border: "1.5px dashed " + colors.gray[200], background: colors.gray[50], touchAction: "none", cursor: "crosshair",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <button type="button" onClick={handleClear} style={{
            display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
            padding: "6px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[600], fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: font,
          }}>
            <Trash2 size={13} /> Effacer
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input type="file" accept="image/*" onChange={handleUpload} style={{ fontSize: 13, fontFamily: font }} />
          {value && (
            <img src={value} alt="Signature" style={{
              maxWidth: 300, maxHeight: 120, border: "1px solid " + colors.gray[200],
              borderRadius: radius.md, padding: 8, background: colors.white,
            }} />
          )}
        </div>
      )}

      {mode === "draw" && value && (
        <div>
          <p style={{ fontSize: 11.5, color: colors.gray[600], margin: "4px 0" }}>Aperçu enregistré :</p>
          <img src={value} alt="Signature enregistrée" style={{
            maxWidth: 300, maxHeight: 100, border: "1px solid " + colors.gray[200],
            borderRadius: radius.md, padding: 8, background: colors.white,
          }} />
        </div>
      )}
    </div>
  );
}