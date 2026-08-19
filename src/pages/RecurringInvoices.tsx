import React, { useMemo, useState } from "react";
import {
  Plus, Loader2, Repeat, Pause, Play, Trash2, X, Check, Calendar,
} from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useClients } from "../modules/clients/useClients";
import {
  useRecurringInvoices, useProductsForPicker, useCreateRecurringInvoice,
  useUpdateRecurringInvoiceStatus, useDeleteRecurringInvoice,
} from "../modules/recurringInvoices/useRecurringInvoices";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const FREQUENCIES = [
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "mensuelle", label: "Mensuelle" },
  { value: "trimestrielle", label: "Trimestrielle" },
  { value: "annuelle", label: "Annuelle" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Actif", color: "#16a34a", bg: "#f0fdf4" },
  en_pause: { label: "En pause", color: "#ca8a04", bg: "#fefce8" },
  terminee: { label: "Terminé", color: "#64748b", bg: "#f8fafc" },
  annulee: { label: "Annulé", color: "#dc2626", bg: "#fef2f2" },
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
  fontSize: 13.5, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
  width: "100%", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>{label}</label>
      {children}
    </div>
  );
}

function frequencyLabel(freq: string, interval: number) {
  const base = FREQUENCIES.find((f) => f.value === freq)?.label || freq;
  if (interval <= 1) return base;
  const unit: Record<string, string> = {
    hebdomadaire: "semaines", mensuelle: "mois", trimestrielle: "trimestres", annuelle: "ans",
  };
  return `Tous les ${interval} ${unit[freq] || ""}`.trim();
}

function computeTotal(items: any[]) {
  return (items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
}

function RecurringInvoiceCard({ rec, onTogglePause, onDelete }: any) {
  const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.active;
  const total = computeTotal(rec.recurring_invoice_items);
  const clientName = rec.clients?.company_name || rec.clients?.name || "Client";

  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 16,
      border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
      display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{rec.label}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[500] }}>{clientName}</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: radius.full,
          background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: colors.gray[600] }}>
        <Repeat size={13} color={colors.gray[400]} />
        {frequencyLabel(rec.frequency, rec.interval_count)}
      </div>

      {rec.status !== "terminee" && rec.status !== "annulee" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: colors.gray[600] }}>
          <Calendar size={13} color={colors.gray[400]} />
          Prochaine facture : {new Date(rec.next_generation_date).toLocaleDateString("fr-FR")}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.gray[900] }}>
        {Math.round(total).toLocaleString("fr-FR")} <span style={{ fontSize: 11.5, fontWeight: 500, color: colors.gray[500] }}>FCFA / occurrence</span>
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {(rec.status === "active" || rec.status === "en_pause") && (
          <button onClick={() => onTogglePause(rec)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 12.5, fontWeight: 700,
            cursor: "pointer", fontFamily: font }}>
            {rec.status === "active" ? <><Pause size={13} /> Mettre en pause</> : <><Play size={13} /> Reprendre</>}
          </button>
        )}
        <button onClick={() => onDelete(rec.id)} style={{
          padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
          background: colors.white, cursor: "pointer" }}>
          <Trash2 size={14} color={palette.danger.solid} />
        </button>
      </div>
    </div>
  );
}

function NewRecurringInvoiceForm({ onClose, onSave, saving, clients, products }: any) {
  const [label, setLabel] = useState("");
  const [clientId, setClientId] = useState("");
  const [frequency, setFrequency] = useState("mensuelle");
  const [intervalCount, setIntervalCount] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [maxOccurrences, setMaxOccurrences] = useState("");
  const [dueDays, setDueDays] = useState(30);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0, taxRate: 18, productId: null }]);

  function updateItem(idx: number, patch: any) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxRate: 18, productId: null }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function pickProduct(idx: number, productId: string) {
    const p = (products || []).find((pr: any) => pr.id === productId);
    if (!p) return;
    updateItem(idx, { productId, description: p.name, unitPrice: p.unit_price, taxRate: p.tax_rate ?? 18 });
  }

  const total = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
  const isValid = label.trim() !== "" && clientId !== "" && items.some((i) => i.description.trim() !== "" && Number(i.unitPrice) > 0);

  function handleSave() {
    onSave({
      label, clientId, frequency, intervalCount: Number(intervalCount),
      startDate, endDate: endDate || null,
      maxOccurrences: maxOccurrences ? Number(maxOccurrences) : null,
      dueDays: Number(dueDays), notes, items,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: colors.gray[50], borderRadius: radius.lg, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto", boxShadow: shadow.hover }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: colors.white, borderBottom: "1px solid " + colors.gray[100],
          position: "sticky", top: 0, zIndex: 10 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouvel abonnement</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={colors.gray[500]} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nom de l'abonnement *">
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Hébergement mensuel" style={inputStyle} />
          </Field>

          <Field label="Client *">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle}>
              <option value="">Sélectionner un client</option>
              {(clients || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <Field label="Fréquence">
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={inputStyle}>
                {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
            <Field label="Tous les">
              <input type="number" min={1} value={intervalCount}
                onChange={(e) => setIntervalCount(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Date de première facture">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Échéance (jours après génération)">
              <input type="number" min={0} value={dueDays} onChange={(e) => setDueDays(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Date de fin (optionnel)">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Nb max d'occurrences (optionnel)">
              <input type="number" min={1} value={maxOccurrences}
                onChange={(e) => setMaxOccurrences(e.target.value)} placeholder="Illimité" style={inputStyle} />
            </Field>
          </div>

          <Field label="Lignes de facturation">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6,
                  padding: 10, borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white }}>
                  {products && products.length > 0 && (
                    <select value={it.productId || ""} onChange={(e) => pickProduct(idx, e.target.value)}
                      style={{ ...inputStyle, fontSize: 12.5 }}>
                      <option value="">— Choisir un produit (optionnel) —</option>
                      {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <input value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })}
                    placeholder="Description" style={inputStyle} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6 }}>
                    <input type="number" min={0} value={it.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      placeholder="Qté" style={inputStyle} />
                    <input type="number" min={0} value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                      placeholder="Prix HT" style={inputStyle} />
                    <input type="number" min={0} value={it.taxRate} onChange={(e) => updateItem(idx, { taxRate: e.target.value })}
                      placeholder="TVA %" style={inputStyle} />
                    <button onClick={() => removeItem(idx)} disabled={items.length === 1} style={{
                      border: "none", background: "none", cursor: items.length === 1 ? "not-allowed" : "pointer",
                      opacity: items.length === 1 ? 0.3 : 1, padding: 4 }}>
                      <Trash2 size={15} color={palette.danger.solid} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addItem} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: radius.md,
                border: "1px dashed " + colors.gray[300], background: "none", color: colors.gray[600],
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: font, width: "fit-content" }}>
                <Plus size={13} /> Ajouter une ligne
              </button>
            </div>
          </Field>

          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900], textAlign: "right" }}>
            Total par occurrence : {Math.round(total).toLocaleString("fr-FR")} FCFA HT
          </p>

          <Field label="Notes (optionnel)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "16px 20px",
          background: colors.white, borderTop: "1px solid " + colors.gray[100], position: "sticky", bottom: 0 }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], background: colors.white, color: colors.gray[600],
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>Annuler</button>
          <button onClick={handleSave} disabled={!isValid || saving} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 16px", borderRadius: radius.md, border: "none",
            background: isValid && !saving ? palette.primary.solid : colors.gray[200],
            color: isValid && !saving ? colors.white : colors.gray[400],
            fontSize: 13, fontWeight: 700, cursor: isValid && !saving ? "pointer" : "not-allowed", fontFamily: font }}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Création...</> : <><Check size={14} /> Créer l'abonnement</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecurringInvoices() {
  const { data: recurring, isLoading, isError } = useRecurringInvoices();
  const { data: clients } = useClients();
  const { data: products } = useProductsForPicker();
  const createRec = useCreateRecurringInvoice();
  const toggleStatus = useUpdateRecurringInvoiceStatus();
  const deleteRec = useDeleteRecurringInvoice();
  const [showForm, setShowForm] = useState(false);

  const sorted = useMemo(() => {
    if (!recurring) return [];
    const order: Record<string, number> = { active: 0, en_pause: 1, terminee: 2, annulee: 3 };
    return [...recurring].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [recurring]);

  function handleSave(data: any) {
    createRec.mutate(data, {
      onSuccess: () => setShowForm(false),
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  function handleTogglePause(rec: any) {
    toggleStatus.mutate({ id: rec.id, status: rec.status === "active" ? "en_pause" : "active" });
  }

  function handleDelete(id: string) {
    if (confirm("Supprimer cet abonnement récurrent ? Les factures déjà générées ne seront pas supprimées.")) {
      deleteRec.mutate(id);
    }
  }

  return (
    <>
      {showForm && (
        <NewRecurringInvoiceForm
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          saving={createRec.isPending}
          clients={clients}
          products={products}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Facturation récurrente" />
        <button onClick={() => setShowForm(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
          borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
          <Plus size={15} /> Nouvel abonnement
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : sorted.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.gray[600], fontSize: 13, padding: "40px 0" }}>
          Aucun abonnement récurrent pour le moment. Les factures d'abonnements (hébergement, maintenance, etc.)
          seront générées automatiquement à la date prévue.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 12 }}>
          {sorted.map((rec: any) => (
            <RecurringInvoiceCard key={rec.id} rec={rec} onTogglePause={handleTogglePause} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  );
}