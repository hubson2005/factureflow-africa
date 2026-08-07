import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Pencil, Check, Loader2, FileText } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useClient, useClientInvoices, useUpdateClient } from "../modules/clients/useClientDetail";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const inputStyle = {
  padding: "10px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
  fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
  width: "100%", boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>{label}</label>
      {children}
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: client, isLoading, isError } = useClient(id);
  const { data: invoices, isLoading: invoicesLoading } = useClientInvoices(id);
  const updateClient = useUpdateClient();

  const [editing, setEditing] = useState(searchParams.get("edit") === "1");
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (searchParams.get("edit") === "1") setEditing(true);
  }, [searchParams]);

  useEffect(() => {
    if (client && !form) {
      setForm({
        name: client.name || "",
        company_name: client.company_name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        tax_number: client.tax_number || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  function setField(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleSave() {
    updateClient.mutate(
      { id, updates: form },
      {
        onSuccess: () => {
          setEditing(false);
          searchParams.delete("edit");
          setSearchParams(searchParams, { replace: true });
        },
        onError: (err) => alert("Erreur : " + err.message),
      }
    );
  }

  function handleCancelEdit() {
    setEditing(false);
    setForm({
      name: client.name || "",
      company_name: client.company_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      tax_number: client.tax_number || "",
      notes: client.notes || "",
    });
    searchParams.delete("edit");
    setSearchParams(searchParams, { replace: true });
  }

  if (isLoading || !form) {
    return (
      <>
        <Header title="Client" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
        </div>
      </>
    );
  }

  if (isError || !client) {
    return (
      <>
        <Header title="Client" />
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Client introuvable.
        </p>
      </>
    );
  }

  const totalDue = (invoices || []).reduce((s, inv) => s + Number(inv.amount_due || 0), 0);
  const totalBilled = (invoices || []).reduce((s, inv) => s + Number(inv.total || 0), 0);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/clients")} style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34,
            borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white, cursor: "pointer",
          }}>
            <ArrowLeft size={15} color={colors.gray[700]} />
          </button>
          <Header title={client.name} />
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
            border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, flexShrink: 0,
          }}>
            <Pencil size={15} /> Modifier
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCancelEdit} style={{
              padding: "9px 14px", borderRadius: radius.md, background: colors.white, color: colors.gray[700],
              border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
            }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={updateClient.isPending} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
              border: "none", fontSize: 13, fontWeight: 700, cursor: updateClient.isPending ? "not-allowed" : "pointer", fontFamily: font,
            }}>
              {updateClient.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Enregistrer
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {editing ? (
          <div style={{ background: colors.white, borderRadius: radius.lg, padding: 18, border: "1px solid " + colors.gray[100], boxShadow: shadow.card, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Nom *">
                <input style={inputStyle} value={form.name} onChange={setField("name")} />
              </Field>
              <Field label="Entreprise">
                <input style={inputStyle} value={form.company_name} onChange={setField("company_name")} />
              </Field>
              <Field label="Email">
                <input type="email" style={inputStyle} value={form.email} onChange={setField("email")} />
              </Field>
              <Field label="Telephone">
                <input style={inputStyle} value={form.phone} onChange={setField("phone")} />
              </Field>
              <Field label="Adresse">
                <input style={inputStyle} value={form.address} onChange={setField("address")} />
              </Field>
              <Field label="Numero fiscal (NCC)">
                <input style={inputStyle} value={form.tax_number} onChange={setField("tax_number")} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.notes} onChange={setField("notes")} />
            </Field>
          </div>
        ) : (
          <div style={{ background: colors.white, borderRadius: radius.lg, padding: 18, border: "1px solid " + colors.gray[100], boxShadow: shadow.card }}>
            {client.company_name && (
              <p style={{ margin: "0 0 10px", fontSize: 13, color: colors.gray[600] }}>{client.company_name}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {client.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.gray[700] }}>
                  <Mail size={15} color={colors.gray[400]} /> {client.email}
                </div>
              )}
              {client.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.gray[700] }}>
                  <Phone size={15} color={colors.gray[400]} /> {client.phone}
                </div>
              )}
              {client.address && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.gray[700] }}>
                  <MapPin size={15} color={colors.gray[400]} /> {client.address}
                </div>
              )}
            </div>
            {client.notes && (
              <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.gray[600], borderTop: "1px solid " + colors.gray[100], paddingTop: 12 }}>
                {client.notes}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ background: colors.white, borderRadius: radius.lg, padding: 14, border: "1px solid " + colors.gray[100], textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.gray[900] }}>{(invoices || []).length}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[600] }}>Factures</p>
          </div>
          <div style={{ background: colors.white, borderRadius: radius.lg, padding: 14, border: "1px solid " + colors.gray[100], textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.gray[900] }}>{totalBilled.toLocaleString("fr-FR")}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[600] }}>FCFA total</p>
          </div>
          <div style={{ background: colors.white, borderRadius: radius.lg, padding: 14, border: "1px solid " + colors.gray[100], textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: totalDue > 0 ? palette.danger.solid : colors.gray[900] }}>{totalDue.toLocaleString("fr-FR")}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[600] }}>FCFA impaye</p>
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 700, color: colors.gray[900] }}>Factures</p>
          {invoicesLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0", gap: 8 }}>
              <Loader2 size={16} color={palette.primary.solid} className="animate-spin" />
              <span style={{ fontSize: 12.5, color: colors.gray[600] }}>Chargement...</span>
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <p style={{ textAlign: "center", color: colors.gray[600], fontSize: 13, padding: "30px 0" }}>
              Aucune facture pour ce client.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {invoices.map((inv) => (
                <div key={inv.id} onClick={() => navigate("/invoices")} style={{
                  display: "flex", alignItems: "center", gap: 12, background: colors.white,
                  borderRadius: radius.md, padding: 12, border: "1px solid " + colors.gray[100], cursor: "pointer",
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: radius.md, background: palette.primary[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={15} color={palette.primary.solid} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>{inv.invoice_number}</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: colors.gray[600] }}>{inv.status}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
                    {Number(inv.total).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

