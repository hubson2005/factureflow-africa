import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, User, Package, FileText, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { useClients } from "../../clients/useClients";
import { useProducts } from "../../products/useProducts";
import { useCompany } from "../../../hooks/useCompany";
import { useVatRates, VAT_RATE_TYPE_SHORT_LABELS } from "../../vat/useVatRates";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const STEPS = [
  { num: 1, label: "Client", icon: User },
  { num: 2, label: "Articles", icon: Package },
  { num: 3, label: "Apercu", icon: FileText },
];

export function NewQuoteForm({ onClose, onSave, saving }) {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: products } = useProducts();
  const { data: company } = useCompany();
  const countryCode = company?.companies?.country_code;
  const { data: vatRates } = useVatRates(countryCode);
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ id: "1", description: "", qty: 1, unitPrice: 0, vatRateType: "normal" }]);

  const ratesByType = {};
  (vatRates || []).forEach((r) => { ratesByType[r.rate_type] = r; });
  const hasMultipleRateTypes = (vatRates || []).length > 1;
  function rateFor(type) {
    const r = ratesByType[type];
    return r ? Number(r.rate_percent) / 100 : 0.18;
  }

  const client = (clients || []).find((c) => c.id === clientId);
  const filteredClients = (clients || []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  // TVA calculee par ligne selon son type de taux, regroupee pour l'affichage.
  const tvaByType = {};
  items.forEach((i) => {
    const lineTotal = i.qty * i.unitPrice;
    tvaByType[i.vatRateType] = (tvaByType[i.vatRateType] || 0) + lineTotal * rateFor(i.vatRateType);
  });
  const tva = Object.values(tvaByType).reduce((s, v) => s + v, 0);
  const total = subtotal + tva;

  const step1Valid = clientId !== "";
  const step2Valid = items.some((i) => i.description.trim() !== "" && i.unitPrice > 0);

  function addItem() {
    setItems((prev) => [...prev, { id: Date.now().toString(), description: "", qty: 1, unitPrice: 0, vatRateType: "normal" }]);
  }
  function removeItem(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }
  function updateItem(id, field, value) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }
  function pickProduct(itemId, productId) {
    const p = (products || []).find((p) => p.id === productId);
    if (!p) return;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, description: p.name, unitPrice: Number(p.unit_price) } : i)));
  }
  function handleSubmit() {
    onSave({ clientId, validUntil, notes, items });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: colors.gray[50], borderRadius: radius.lg, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto", boxShadow: shadow.hover }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: colors.white, borderBottom: "1px solid " + colors.gray[100],
          position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6,
            border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: colors.gray[600], fontFamily: font }}>
            <ArrowLeft size={15} /> Annuler
          </button>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouveau devis</p>
          <div style={{ width: 80 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "20px 20px 0" }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.num;
            const active = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: radius.full,
                    background: done ? palette.green.solid : active ? palette.primary.solid : colors.gray[100],
                    color: done || active ? colors.white : colors.gray[400],
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {done ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600,
                    color: active ? palette.primary.solid : done ? palette.green.solid : colors.gray[400] }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 40, height: 2, background: step > s.num ? palette.green.solid : colors.gray[200],
                    margin: "0 4px 18px" }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

          {step === 1 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.white,
                border: "1px solid " + colors.gray[200], borderRadius: radius.md, padding: "10px 14px" }}>
                <User size={15} color={colors.gray[400]} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un client..."
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: font,
                    color: colors.gray[900], background: "transparent" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clientsLoading ? (
                  <p style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</p>
                ) : filteredClients.length === 0 ? (
                  <p style={{ fontSize: 13, color: colors.gray[600] }}>Aucun client. Ajoutez-en un dans le module Clients.</p>
                ) : filteredClients.map((c) => (
                  <button key={c.id} onClick={() => setClientId(c.id)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: radius.md, cursor: "pointer", fontFamily: font,
                    border: "1px solid " + (clientId === c.id ? palette.primary.solid : colors.gray[200]),
                    background: clientId === c.id ? palette.primary[50] : colors.white,
                  }}>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: colors.gray[900] }}>{c.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: colors.gray[400] }}>{c.email || c.phone || "—"}</p>
                    </div>
                    {clientId === c.id && <Check size={16} color={palette.primary.solid} />}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>Valable jusqu'au</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                  style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white }} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {items.map((item, idx) => (
                <div key={item.id} style={{ background: colors.gray[50], borderRadius: radius.lg,
                  padding: 14, border: "1px solid " + colors.gray[200], display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[600] }}>{"Article " + (idx + 1)}</span>
                    <button onClick={() => removeItem(item.id)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                      <Trash2 size={15} color={palette.danger.solid} />
                    </button>
                  </div>
                  {products && products.length > 0 && (
                    <select onChange={(e) => pickProduct(item.id, e.target.value)} defaultValue=""
                      style={{ padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                        fontSize: 13, fontFamily: font, color: colors.gray[600], background: colors.white }}>
                      <option value="" disabled>Choisir un produit...</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Description..."
                    style={{ padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                      fontSize: 13, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white }} />
                  {hasMultipleRateTypes && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600] }}>Regime TVA</label>
                      <select value={item.vatRateType} onChange={(e) => updateItem(item.id, "vatRateType", e.target.value)}
                        style={{ width: "100%", marginTop: 3, padding: "9px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                          fontSize: 13, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white, boxSizing: "border-box" }}>
                        {(vatRates || []).map((r) => (
                          <option key={r.rate_type} value={r.rate_type}>
                            {(VAT_RATE_TYPE_SHORT_LABELS[r.rate_type] || r.rate_type) + " (" + Number(r.rate_percent) + "%)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {item.vatRateType === "exonere" && (
                    <input value={item.vatExemptionReason || ""} onChange={(e) => updateItem(item.id, "vatExemptionReason", e.target.value)}
                      placeholder="Motif d'exoneration (optionnel)..."
                      style={{ padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                        fontSize: 12.5, fontFamily: font, color: colors.gray[700], outline: "none", background: colors.white }} />
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600] }}>Qte</label>
                      <input type="number" value={item.qty} min={0}
                        onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                        style={{ width: "100%", padding: "9px 10px", borderRadius: radius.md,
                          border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font,
                          color: colors.gray[900], outline: "none", background: colors.white, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600] }}>Prix unit.</label>
                      <input type="number" value={item.unitPrice} min={0}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        style={{ width: "100%", padding: "9px 10px", borderRadius: radius.md,
                          border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font,
                          color: colors.gray[900], outline: "none", background: colors.white, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600] }}>Total</label>
                      <div style={{ padding: "9px 10px", borderRadius: radius.md,
                        border: "1px solid " + colors.gray[100], background: colors.gray[50],
                        fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
                        {(item.qty * item.unitPrice).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addItem} style={{ display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, padding: "12px", borderRadius: radius.md, border: "2px dashed " + colors.gray[200],
                background: "transparent", fontSize: 13, fontWeight: 600, color: colors.gray[600],
                cursor: "pointer", fontFamily: font }}>
                <Plus size={15} /> Ajouter un article
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>Notes (optionnel)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Conditions, remarques..."
                  rows={2} style={{ padding: "11px 14px", borderRadius: radius.md,
                    border: "1px solid " + colors.gray[200], fontSize: 14, fontFamily: font,
                    color: colors.gray[900], outline: "none", background: colors.white,
                    resize: "vertical", width: "100%", boxSizing: "border-box" }} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ background: colors.white, borderRadius: radius.lg, padding: 16,
                border: "1px solid " + colors.gray[100] }}>
                <p style={{ margin: 0, fontSize: 13, color: colors.gray[600] }}>
                  {"Client : "}<strong style={{ color: colors.gray[900] }}>{client ? client.name : "—"}</strong>
                </p>
                {validUntil && <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.gray[600] }}>
                  {"Valable jusqu'au : " + validUntil}
                </p>}
              </div>
              <div style={{ background: colors.white, borderRadius: radius.lg, padding: 16,
                border: "1px solid " + colors.gray[100] }}>
                {items.filter((i) => i.description).map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderBottom: "1px solid " + colors.gray[100] }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{item.description}</p>
                      <p style={{ margin: 0, fontSize: 12, color: colors.gray[400] }}>
                        {"x" + item.qty + " x " + item.unitPrice.toLocaleString("fr-FR") + " FCFA"}
                      </p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
                      {(item.qty * item.unitPrice).toLocaleString("fr-FR") + " FCFA"}
                    </p>
                  </div>
                ))}
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: colors.gray[600] }}>Sous-total</span>
                    <span style={{ fontSize: 13, color: colors.gray[900] }}>{subtotal.toLocaleString("fr-FR") + " FCFA"}</span>
                  </div>
                  {Object.entries(tvaByType).map(([type, amount]) => (
                    <div key={type} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: colors.gray[600] }}>
                        {"TVA " + (VAT_RATE_TYPE_SHORT_LABELS[type] || type).toLowerCase() + " (" + Math.round(rateFor(type) * 100) + "%)"}
                      </span>
                      <span style={{ fontSize: 13, color: colors.gray[900] }}>{Math.round(amount).toLocaleString("fr-FR") + " FCFA"}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0",
                    borderTop: "2px solid " + colors.gray[900], marginTop: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Total</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: palette.primary.solid }}>
                      {total.toLocaleString("fr-FR") + " FCFA"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, padding: "16px 20px",
          background: colors.white, borderTop: "1px solid " + colors.gray[100],
          position: "sticky", bottom: 0 }}>
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)} style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "11px 16px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
              background: colors.white, fontSize: 13, fontWeight: 600, color: colors.gray[700],
              cursor: "pointer", fontFamily: font }}>
              <ArrowLeft size={14} /> Retour
            </button>
          )}
          {step < 3 && (
            <button onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "11px 16px", borderRadius: radius.md, border: "none",
                background: (step === 1 ? step1Valid : step2Valid) ? palette.primary.solid : colors.gray[200],
                color: (step === 1 ? step1Valid : step2Valid) ? colors.white : colors.gray[400],
                fontSize: 13, fontWeight: 700,
                cursor: (step === 1 ? step1Valid : step2Valid) ? "pointer" : "not-allowed", fontFamily: font }}>
              Continuer <ArrowRight size={14} />
            </button>
          )}
          {step === 3 && (
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, display: "flex",
              alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 16px",
              borderRadius: radius.md, border: "none", background: palette.primary.solid,
              color: colors.white, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: font }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Creation...</> : <><Check size={14} /> Creer le devis</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
