import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingDown, ChevronDown, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { palette, colors, radius, shadow, typography } from "@/theme/tokens";
import { Card, Button, IconBadgeSquare, Avatar } from "@/components/Primitives";
import { supabase } from "@/supabase";

const fontFamily = typography.fontFamily;

const RISK_CONFIG = {
  fiable: { label: "Fiable", ...palette.green, emoji: "🟢" },
  moyen: { label: "Moyen", ...palette.yellow, emoji: "🟡" },
  risque: { label: "Risqué", ...palette.danger, emoji: "🔴" },
};

function RiskPill({ level, score }) {
  const r = RISK_CONFIG[level] ?? RISK_CONFIG.moyen;
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: radius.full,
      background: r[50], color: r.solid, fontFamily, whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {r.emoji} {score !== null ? Math.round(score) : "—"}
    </span>
  );
}

export default function AIRecoveryPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    initCompanyAndFetch();
  }, []);

  async function initCompanyAndFetch() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyUser, error: cuError } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (cuError || !companyUser) {
        toast.error("Entreprise introuvable pour cet utilisateur");
        return;
      }

      setCompanyId(companyUser.company_id);
      await fetchOverdueWithScores(companyUser.company_id);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOverdueWithScores(cId) {
    const targetCompanyId = cId ?? companyId;
    if (!targetCompanyId) return;
    setLoading(true);
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, total, amount_due, due_date, client_id, clients(name)")
        .eq("company_id", targetCompanyId)
        .gt("amount_due", 0)
        .lt("due_date", new Date().toISOString().split("T")[0])
        .neq("status", "brouillon")
        .order("due_date", { ascending: true });

      if (error) throw error;

      const clientIds = [...new Set((invoices ?? []).map((i) => i.client_id))];

      const { data: scores } = await supabase
        .from("client_scores")
        .select("client_id, score, payment_probability, risk_level, ranking_label")
        .eq("company_id", targetCompanyId)
        .in("client_id", clientIds.length ? clientIds : ["00000000-0000-0000-0000-000000000000"]);

      const scoreMap = Object.fromEntries((scores ?? []).map((s) => [s.client_id, s]));

      const merged = (invoices ?? []).map((inv) => {
        const daysLate = Math.floor(
          (Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const score = scoreMap[inv.client_id];
        return {
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          clientName: inv.clients?.name ?? "Client inconnu",
          clientId: inv.client_id,
          amount: inv.amount_due,
          daysLate,
          score: score?.score ?? null,
          probability: score?.payment_probability ?? null,
          riskLevel: score?.risk_level ?? "moyen",
          rankingLabel: score?.ranking_label ?? null,
        };
      });

      setRows(merged);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des impayés");
    } finally {
      setLoading(false);
    }
  }

async function handleSendReminder(row) {
    if (sendingId) return; // empêche un second clic pendant l'envoi en cours
    setSendingId(row.id);
    try {
      const { error } = await supabase.from("payment_reminders").insert({
        company_id: companyId,
        client_id: row.clientId,
        invoice_id: row.id,
        reminder_stage: row.daysLate >= 30 ? "J+30" : row.daysLate >= 15 ? "J+15" : row.daysLate >= 7 ? "J+7" : row.daysLate >= 3 ? "J+3" : "J+1",
        channel: row.riskLevel === "risque" ? "whatsapp" : "email",
        tone: row.riskLevel === "risque" ? "difficile" : "fidele",
        scheduled_for: new Date().toISOString(),
        status: "pending",
      });
      if (error) {
        if (error.code === "23505") {
          toast.info(`Une relance a déjà été programmée pour ${row.clientName} à ce stade`);
        } else {
          throw error;
        }
      } else {
        toast.success(`Relance programmée pour ${row.clientName}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de programmer la relance");
    } finally {
      setSendingId(null);
    }
  }
  const filteredRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.riskLevel === filter)),
    [rows, filter]
  );

  const totalDue = useMemo(
    () => filteredRows.reduce((s, r) => s + Number(r.amount || 0), 0),
    [filteredRows]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <IconBadgeSquare icon={AlertTriangle} color="danger" size={44} />
          <div>
            <h2 style={{ ...typography.subtitle, margin: 0, color: colors.gray[900] }}>
              Recouvrement IA
            </h2>
            <p style={{ ...typography.caption, margin: "2px 0 0", color: colors.gray[600] }}>
              {rows.length} facture{rows.length !== 1 ? "s" : ""} en retard · {Math.round(totalDue).toLocaleString("fr-FR")} FCFA à recouvrer
            </p>
          </div>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={() => fetchOverdueWithScores()}>
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", "fiable", "moyen", "risque"].map((key) => {
          const active = filter === key;
          const r = key !== "all" ? RISK_CONFIG[key] : null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "6px 14px", borderRadius: radius.full, fontSize: 13, fontWeight: 600,
                fontFamily, cursor: "pointer",
                border: `1px solid ${active ? palette.primary.solid : colors.gray[200]}`,
                background: active ? palette.primary[50] : colors.white,
                color: active ? palette.primary.text : colors.gray[600],
              }}
            >
              {key === "all" ? "Tous" : `${r.emoji} ${r.label}`}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      {loading ? (
        <Card><p style={{ textAlign: "center", color: colors.gray[600], margin: 0 }}>Chargement...</p></Card>
      ) : filteredRows.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <TrendingDown size={28} color={colors.gray[400]} />
            <p style={{ margin: 0, color: colors.gray[600], fontSize: 14 }}>Aucun impayé dans cette catégorie 🎉</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredRows.map((row) => (
            <RecoveryRow
              key={row.id}
              row={row}
              expanded={expandedRow === row.id}
              onToggle={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
              onSend={() => handleSendReminder(row)}
              sending={sendingId === row.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecoveryRow({ row, expanded, onToggle, onSend, sending }) {
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, cursor: "pointer" }}
      >
        <Avatar initials={row.clientName.slice(0, 2).toUpperCase()} color={row.riskLevel === "risque" ? "danger" : row.riskLevel === "fiable" ? "green" : "yellow"} size={38} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{row.clientName}</span>
            {row.rankingLabel && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: palette.purple.solid, background: palette.purple[50], padding: "2px 8px", borderRadius: radius.full }}>
                {row.rankingLabel}
              </span>
            )}
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: colors.gray[600] }}>
            Facture #{row.invoiceNumber} · {row.daysLate}j de retard
          </p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
            {Number(row.amount).toLocaleString("fr-FR")} FCFA
          </p>
        </div>

        <RiskPill level={row.riskLevel} score={row.score} />

        <ChevronDown
          size={16} color={colors.gray[400]}
          style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 150ms ease", flexShrink: 0 }}
        />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
           <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${colors.gray[100]}`, marginTop: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", fontSize: 13, color: colors.gray[600] }}>
                <span>Probabilité de paiement</span>
              <strong style={{ color: colors.gray[900] }}>{row.probability !== null ? `${row.probability.toFixed(0)}%` : "—"}</strong>
              </div>
              <Button variant="primary" icon={Send} full onClick={onSend} disabled={sending}>
                {sending ? "Envoi..." : "Relancer maintenant"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}