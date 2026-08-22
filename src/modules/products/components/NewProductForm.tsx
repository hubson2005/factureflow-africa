import React, { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const CATEGORIES = ["Service", "Produit", "Abonnement"];

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>{label}</label>
      {children}
    </div>
  );
}

export function NewProductForm({ onClose, onSave, saving }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Service");
  const [unitPrice, setUnitPrice] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  const [trackStock, setTrackStock] = useState(false);
  const [sku, setSku] = useState("");
  const [stockAlertThreshold, setStockAlertThreshold] = useState("0");

  const isValid = name.trim() !== "" && Number(unitPrice) > 0;

  function handleSubmit() {
    onSave({
      name,
      description,
      category,
      unitPrice: Number(unitPrice),
      taxRate: Number(taxRate),
      trackStock: category === "Produit" && trackStock,
      sku: sku || null,
      stockAlertThreshold: Number(stockAlertThreshold) || 0,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: colors.gray[50], borderRadius: radius.lg, width: "100%", maxWidth: 460,
        maxHeight: "90vh", overflowY: "auto", boxShadow: shadow.hover }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: colors.white, borderBottom: "1px solid " + colors.gray[100],
          position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6,
            border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: colors.gray[600], fontFamily: font }}>
            <ArrowLeft size={15} /> Annuler
          </button>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouveau produit</p>
          <div style={{ width: 80 }} />
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Nom du produit ou service *">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Conseil juridique"
              style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                width: "100%", boxSizing: "border-box" }} />
          </Field>

          <Field label="Categorie">
            <div style={{ display: "flex", gap: 8 }}>
              {CATEGORIES.map((c) => {
                const isActive = category === c;
                return (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    flex: 1, padding: "10px", borderRadius: radius.md, fontSize: 13, fontWeight: 600,
                    border: isActive ? "none" : "1px solid " + colors.gray[200],
                    background: isActive ? palette.primary.solid : colors.white,
                    color: isActive ? colors.white : colors.gray[600], cursor: "pointer", fontFamily: font,
                  }}>{c}</button>
                );
              })}
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Prix unitaire (FCFA) *">
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} min={0}
                placeholder="50000"
                style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                  width: "100%", boxSizing: "border-box" }} />
            </Field>
            <Field label="TVA (%)">
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min={0}
                style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                  width: "100%", boxSizing: "border-box" }} />
            </Field>
          </div>

          <Field label="Description (optionnel)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Details du produit ou service..."
              style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                resize: "vertical", width: "100%", boxSizing: "border-box" }} />
          </Field>

          {category === "Produit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14, borderRadius: radius.md,
              border: "1px solid " + colors.gray[200], background: colors.white }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>Suivre le stock de ce produit</span>
              </label>
              {trackStock && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="SKU (optionnel)">
                    <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="REF-001"
                      style={{ padding: "10px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                        fontSize: 13, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                        width: "100%", boxSizing: "border-box" }} />
                  </Field>
                  <Field label="Seuil d'alerte">
                    <input type="number" min={0} value={stockAlertThreshold} onChange={(e) => setStockAlertThreshold(e.target.value)}
                      style={{ padding: "10px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                        fontSize: 13, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                        width: "100%", boxSizing: "border-box" }} />
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", padding: "16px 20px", background: colors.white,
          borderTop: "1px solid " + colors.gray[100], position: "sticky", bottom: 0 }}>
          <button onClick={handleSubmit} disabled={!isValid || saving} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "12px 16px", borderRadius: radius.md, border: "none",
            background: isValid && !saving ? palette.primary.solid : colors.gray[200],
            color: isValid && !saving ? colors.white : colors.gray[400],
            fontSize: 14, fontWeight: 700, cursor: isValid && !saving ? "pointer" : "not-allowed", fontFamily: font,
          }}>
            {saving ? <><Loader2 size={15} className="animate-spin" /> Creation...</> : <><Check size={15} /> Ajouter le produit</>}
          </button>
        </div>
      </div>
    </div>
  );
}
