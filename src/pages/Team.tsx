import React, { useState, useEffect, useCallback } from "react";
import {
  Mail, Loader2, Plus, X, Trash2, Copy, Check,
  AlertCircle, ShieldCheck, ShieldAlert, ShieldQuestion,
} from "lucide-react";
import { Header } from "../components/shell/Header";
import { useAuth } from "../AuthContext";
import { supabase } from "../supabase";

const P = {
  primary: { solid: "#F97316", text: "#D85F0A", 50: "#FFF4EC" },
  gray: { 50: "#F8FAFA", 100: "#F1F3F3", 200: "#E4E7E7", 400: "#9CA6A6", 600: "#5B6666", 900: "#14181A" },
  white: "#FFFFFF",
  danger: { solid: "#E0383E", 50: "#FBEAEA" },
  success: { solid: "#22C55E", 50: "#F0FDF4" },
  blue: { solid: "#2F6FED", 50: "#EAF1FE" },
  purple: { solid: "#8B5CF6", 50: "#F3EEFE" },
};
const R = { md: 12, lg: 16, full: 9999 };
const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const ROLE_LABELS = {
  admin: "Administrateur",
  manager: "Manager",
  comptable: "Comptable",
};

const ROLE_ICONS = {
  admin: <ShieldCheck size={14} color={P.success.solid} />,
  manager: <ShieldAlert size={14} color={P.blue.solid} />,
  comptable: <ShieldQuestion size={14} color={P.purple.solid} />,
};

export default function Team() {
  const { user, company } = useAuth();

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    const [membersRes, invitesRes] = await Promise.all([
      supabase.from("company_users").select("*").eq("company_id", company.id).order("created_at", { ascending: true }),
      supabase.from("invitations").select("*").eq("company_id", company.id).is("accepted_at", null).order("created_at", { ascending: false }),
    ]);

    setMembers(membersRes.data || []);
    setInvitations(invitesRes.data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCancelInvite(id) {
    await supabase.from("invitations").delete().eq("id", id);
    loadData();
  }

  async function handleToggleActive(member) {
    if (member.user_id === user.id) return;
    await supabase.from("company_users").update({ is_active: !member.is_active }).eq("id", member.id);
    loadData();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Equipe" />
        <button onClick={() => setShowInviteModal(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
          borderRadius: R.md, background: P.primary.solid, color: P.white,
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, flexShrink: 0 }}>
          <Plus size={15} /> Inviter un membre
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={20} className="animate-spin" color={P.primary.solid} />
        </div>
      ) : (
        <>
          <Section title={"Membres (" + members.length + ")"}>
            <Table>
              {members.map((m) => (
                <Row key={m.id}>
                  <Cell flex={2}>
                    <div style={{ width: 32, height: 32, borderRadius: R.full, background: P.primary[50],
                      color: P.primary.solid, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {(m.full_name || m.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: P.gray[900], fontSize: 13.5, fontWeight: 600 }}>{m.full_name || "\u2014"}</div>
                      <div style={{ color: P.gray[600], fontSize: 12.5 }}>{m.email}</div>
                    </div>
                  </Cell>
                  <Cell flex={1}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: P.gray[600], fontSize: 13 }}>
                      {ROLE_ICONS[m.role]} {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </Cell>
                  <Cell flex={1}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: R.full,
                      background: m.is_active ? P.success[50] : P.danger[50],
                      color: m.is_active ? P.success.solid : P.danger.solid,
                    }}>
                      {m.is_active ? "Actif" : "Desactive"}
                    </span>
                  </Cell>
                  <Cell flex={1} align="right">
                    {m.user_id !== user.id && m.role !== "admin" && (
                      <button onClick={() => handleToggleActive(m)} style={{
                        background: "none", border: "none", color: P.primary.solid,
                        fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
                        {m.is_active ? "Desactiver" : "Reactiver"}
                      </button>
                    )}
                  </Cell>
                </Row>
              ))}
            </Table>
          </Section>

          {invitations.length > 0 && (
            <Section title={"Invitations en attente (" + invitations.length + ")"}>
              <Table>
                {invitations.map((inv) => (
                  <Row key={inv.id}>
                    <Cell flex={2}>
                      <Mail size={14} color={P.gray[400]} />
                      <span style={{ color: P.gray[600], fontSize: 12.5 }}>{inv.email}</span>
                    </Cell>
                    <Cell flex={1}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: P.gray[600], fontSize: 13 }}>
                        {ROLE_ICONS[inv.role]} {ROLE_LABELS[inv.role]}
                      </span>
                    </Cell>
                    <Cell flex={1}>
                      <InviteLinkCopy token={inv.token} />
                    </Cell>
                    <Cell flex={1} align="right">
                      <button onClick={() => handleCancelInvite(inv.id)} style={{
                        background: "none", border: "none", color: P.danger.solid, cursor: "pointer", padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </Cell>
                  </Row>
                ))}
              </Table>
            </Section>
          )}
        </>
      )}

      {showInviteModal && (
        <InviteModal
          companyId={company.id}
          invitedBy={user.id}
          onClose={() => setShowInviteModal(false)}
          onCreated={() => { setShowInviteModal(false); loadData(); }}
        />
      )}
    </>
  );
}

function InviteLinkCopy({ token }) {
  const [copied, setCopied] = useState(false);
  const link = window.location.origin + "/join/" + token;

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 5,
      background: "none", border: "1px solid " + P.gray[200], color: P.gray[600], fontSize: 12,
      padding: "5px 10px", borderRadius: R.md, cursor: "pointer", fontFamily: font }}>
      {copied ? <><Check size={13} color={P.success.solid} /> Copie</> : <><Copy size={13} /> Copier le lien</>}
    </button>
  );
}

function InviteModal({ companyId, invitedBy, onClose, onCreated }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("manager");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdToken, setCreatedToken] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: insertError } = await supabase
      .from("invitations")
      .insert({ company_id: companyId, email, role, invited_by: invitedBy })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message.includes("deja membre") ? insertError.message : "Erreur lors de la creation de l'invitation.");
      return;
    }

    setCreatedToken(data.token);
  }

  const link = createdToken ? window.location.origin + "/join/" + createdToken : "";
  const inputStyle = {
    background: P.gray[50], border: "1px solid " + P.gray[200], borderRadius: R.md,
    padding: "11px 14px", color: P.gray[900], fontSize: 14, outline: "none", fontFamily: font,
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420,
        background: P.white, borderRadius: R.lg, padding: 24, fontFamily: font }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ color: P.gray[900], fontSize: 17, fontWeight: 700, margin: 0 }}>Inviter un membre</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: P.gray[600], cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {!createdToken ? (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, color: P.gray[600] }}>Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@exemple.com" style={inputStyle} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, color: P.gray[600] }}>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                <option value="manager">Manager - gere clients, devis, factures, paiements</option>
                <option value="comptable">Comptable - consulte et enregistre les paiements</option>
              </select>
            </label>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: P.danger[50],
                border: "1px solid " + P.danger.solid + "33", color: P.danger.solid, borderRadius: R.md,
                padding: "9px 13px", fontSize: 12.5 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: loading ? P.gray[200] : P.primary.solid, color: loading ? P.gray[400] : P.white,
              fontWeight: 700, border: "none", borderRadius: R.md, padding: "12px 0", fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontFamily: font }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Generer le lien d'invitation"}
            </button>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: P.gray[600], fontSize: 13.5, lineHeight: 1.6 }}>
              {"Invitation creee pour "}<strong style={{ color: P.gray[900] }}>{email}</strong>{". Partagez ce lien (WhatsApp, email...) :"}
            </p>
            <div style={{ background: P.gray[50], border: "1px solid " + P.gray[200], borderRadius: R.md,
              padding: "12px 14px", wordBreak: "break-all" }}>
              <span style={{ color: P.primary.solid, fontSize: 12.5, fontFamily: "monospace" }}>{link}</span>
            </div>
            <button onClick={() => navigator.clipboard.writeText(link)} style={{
              background: P.primary.solid, color: P.white, fontWeight: 700, border: "none",
              borderRadius: R.md, padding: "12px 0", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: font }}>
              <Copy size={15} /> Copier le lien
            </button>
            <button onClick={onCreated} style={{
              background: "transparent", color: P.gray[600], fontWeight: 600,
              border: "1px solid " + P.gray[200], borderRadius: R.md, padding: "12px 0", fontSize: 14,
              cursor: "pointer", fontFamily: font }}>
              Termine
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24, marginTop: 20 }}>
      <div style={{ color: P.gray[600], fontSize: 12.5, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.04em", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Table({ children }) {
  return (
    <div style={{ background: P.white, border: "1px solid " + P.gray[100], borderRadius: R.lg, overflow: "hidden" }}>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 18px",
      borderBottom: "1px solid " + P.gray[100], gap: 8 }}>
      {children}
    </div>
  );
}

function Cell({ children, flex = 1, align = "left" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex,
      justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
      {children}
    </div>
  );
}