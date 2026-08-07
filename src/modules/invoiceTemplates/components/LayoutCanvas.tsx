// src/modules/invoiceTemplates/components/LayoutCanvas.tsx
//
// Canvas A4 miniature permettant de positionner librement les blocs
// (logo, infos entreprise, tableau, totaux, QR code, signature) par glisser-déposer.
// Les positions sont stockées en millimètres (coordonnées de la page A4 réelle : 210x297mm).

import React, { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const SCALE = 2.1; // px par mm

// Taille approximative de chaque bloc (mm), pour l'affichage et le clamp dans le canvas
const BLOCK_SIZES: Record<string, { w: number; h: number; label: string; color: string }> = {
  logo: { w: 16, h: 16, label: "Logo", color: palette.primary.solid },
  company_info: { w: 88, h: 34, label: "Infos entreprise", color: palette.blue.solid },
  items_table: { w: 190, h: 50, label: "Tableau produits", color: palette.green.solid },
  totals: { w: 80, h: 36, label: "Totaux", color: "#d97706" },
  qr_code: { w: 22, h: 22, label: "QR Code", color: palette.purple.solid },
  signature: { w: 50, h: 24, label: "Signature", color: palette.danger.solid },
};

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  logo: { x: 10, y: 7 },
  company_info: { x: 10, y: 63 },
  items_table: { x: 10, y: 104 },
  totals: { x: 120, y: 180 },
  qr_code: { x: 10, y: 230 },
  signature: { x: 140, y: 230 },
};

export interface LayoutBlocksValue {
  [key: string]: { x: number; y: number } | undefined;
}

export function LayoutCanvas({
  value, onChange, visibleBlocks,
}: {
  value: LayoutBlocksValue;
  onChange: (v: LayoutBlocksValue) => void;
  visibleBlocks: string[]; // ex: ["logo","company_info","items_table","totals"] (+ qr_code/signature si actifs)
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  function getPos(key: string) {
    return value[key] || DEFAULT_POSITIONS[key] || { x: 10, y: 10 };
  }

  function handlePointerDown(e: React.PointerEvent, key: string) {
    e.preventDefault();
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const pos = getPos(key);
    dragOffset.current = {
      x: (e.clientX - rect.left) / SCALE - pos.x,
      y: (e.clientY - rect.top) / SCALE - pos.y,
    };
    setDragging(key);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const size = BLOCK_SIZES[dragging];
    let x = (e.clientX - rect.left) / SCALE - dragOffset.current.x;
    let y = (e.clientY - rect.top) / SCALE - dragOffset.current.y;
    x = Math.max(0, Math.min(PAGE_W_MM - size.w, x));
    y = Math.max(0, Math.min(PAGE_H_MM - size.h, y));
    onChange({ ...value, [dragging]: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } });
  }

  function handlePointerUp() {
    setDragging(null);
  }

  function handleReset() {
    onChange({});
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 12, color: colors.gray[500] }}>
          Glissez les blocs pour les repositionner librement sur la page.
        </p>
        <button onClick={handleReset} style={{
          display: "flex", alignItems: "center", gap: 5, border: "none", background: "none",
          cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: colors.gray[500], fontFamily: font,
        }}>
          <RotateCcw size={12} /> Réinitialiser
        </button>
      </div>

      <div
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: "relative",
          width: PAGE_W_MM * SCALE,
          height: PAGE_H_MM * SCALE,
          background: colors.white,
          border: "1px solid " + colors.gray[200],
          borderRadius: radius.md,
          margin: "0 auto",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {visibleBlocks.map((key) => {
          const size = BLOCK_SIZES[key];
          if (!size) return null;
          const pos = getPos(key);
          const isDragging = dragging === key;
          return (
            <div
              key={key}
              onPointerDown={(e) => handlePointerDown(e, key)}
              style={{
                position: "absolute",
                left: pos.x * SCALE,
                top: pos.y * SCALE,
                width: size.w * SCALE,
                height: size.h * SCALE,
                background: size.color + "22",
                border: "1.5px " + (isDragging ? "solid" : "dashed") + " " + size.color,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
                userSelect: "none",
                zIndex: isDragging ? 10 : 1,
              }}
            >
              <span style={{ fontSize: 9.5, fontWeight: 700, color: size.color, textAlign: "center",
                padding: "0 4px", fontFamily: font, pointerEvents: "none" }}>
                {size.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}