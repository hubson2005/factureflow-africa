import React, { useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, Plus, Trash2, Loader2,
  Bot, Download, X, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import {
  useCashFlowSummary, useCashFlowForecast, useRecurringTransactions,
  useCreateRecurringTransaction, useToggleRecurringTransaction,
  useDeleteRecurringTransaction, useUpdateCashBalance, useAskCashFlowAssistant,
} from "../modules/cashflow/useCashFlow";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const PERIODS = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
  { value: 180, label: "6 mois" },
  { value: 365, label: "12 mois" },
];

const CATEGORY_LABELS = {
  salaires: "Salaires",
  abonnements: "Abonnements",
  loyer: "Loyer",
  fournitures: "Fournitures",
  autre: "Autre",
};

function formatFCFA(n) {
  return Number(n || 0).toLocaleString("fr-FR") + " FCFA";
}

function Card({ children, style }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.lg, padding: 18,
      border: "1px solid " + colors.gray[100], boxShadow: shadow.card, ...style,
    }}>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: radius.md, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={iconColor} />
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600], fontWeight: 600 }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.gray[900] }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 11.5, color: subColor || colors.gray[500], fontWeight: 600 }}>{sub}</p>}
    </Card>
  );
}

function RecurringTransactionModal({ onClose, onSave, saving }) {
  const [type, setType] = useState("expense");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("autre");
  const [frequency, setFrequency] = useState("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("5");

  const inputStyle = {
    padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
    fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
    width: "100%", boxSizing: "border-box",
  };

  const isValid = label.trim() && Number(amount) > 0;

  function handleSubmit() {
    onSave({
      type, label: label.trim(), amount: Number(amount), category, frequency,
      dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : null,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: colors.gray[50], borderRadius: radius.lg, width: "100%", maxWidth: 440,
        maxHeight: "90vh", overflowY: "auto", boxShadow: shadow.hover }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: colors.white, borderBottom: "1px solid " + colors.gray[100] }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>
            Nouvelle transaction récurrente
          </p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={colors.gray[500]} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setType("income")} style={{
              flex: 1, padding: "10px", borderRadius: radius.md, cursor: "pointer", fontWeight: 700, fontSize: 13,
              border: "1px solid " + (type === "income" ? palette.green.solid : colors.gray[200]),
              background: type === "income" ? palette.green[50] : colors.white,
              color: type === "income" ? palette.green.solid : colors.gray[600],
            }}>Revenu</button>
            <button onClick={() => setType("expense")} style={{
              flex: 1, padding: "10px", borderRadius: radius.md, cursor: "pointer", fontWeight: 700, fontSize: 13,
              border: "1px solid " + (type === "expense" ? palette.danger.solid : colors.gray[200]),
              background: type === "expense" ? palette.danger[50] : colors.white,
              color: type === "expense" ? palette.danger.solid : colors.gray[600],
            }}>Dépense</button>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600], display: "block", marginBottom: 6 }}>Libellé</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Salaire équipe" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600], display: "block", marginBottom: 6 }}>Montant (FCFA)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} placeholder="400000" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600], display: "block", marginBottom: 6 }}>Catégorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600], display: "block", marginBottom: 6 }}>Fréquence</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={inputStyle}>
              <option value="monthly">Mensuelle</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="yearly">Annuelle</option>
            </select>
          </div>

          {frequency === "monthly" && (
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600], display: "block", marginBottom: 6 }}>Jour du mois</label>
              <input type="number" min={1} max={28} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} style={inputStyle} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", padding: "16px 20px", background: colors.white, borderTop: "1px solid " + colors.gray[100] }}>
          <button onClick={handleSubmit} disabled={!isValid || saving} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "12px 16px", borderRadius: radius.md, border: "none",
            background: isValid && !saving ? palette.primary.solid : colors.gray[200],
            color: isValid && !saving ? colors.white : colors.gray[400],
            fontSize: 14, fontWeight: 700, cursor: isValid && !saving ? "pointer" : "not-allowed", fontFamily: font,
          }}>
            {saving ? <><Loader2 size={15} className="animate-spin" /> Création...</> : <><Check size={15} /> Ajouter</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CashFlowForecast() {
  const [days, setDays] = useState(30);
  const [showModal, setShowModal] = useState(false);
  const [balanceInput, setBalanceInput] = useState(null);

  const { data: summary, isLoading: loadingSummary } = useCashFlowSummary(days);
  const { data: forecast, isLoading: loadingForecast } = useCashFlowForecast(days);
  const { data: recurring, isLoading: loadingRecurring } = useRecurringTransactions();
  const createRecurring = useCreateRecurringTransaction();
  const toggleRecurring = useToggleRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();
  const updateBalance = useUpdateCashBalance();
  const askAssistant = useAskCashFlowAssistant();
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]); // [{question, answer}]

  const chartData = useMemo(() => {
    if (!forecast) return [];
    return forecast.map((f) => ({
      date: new Date(f.forecast_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      solde: Number(f.projected_balance),
    }));
  }, [forecast]);

  const insights = useMemo(() => {
    if (!summary) return [];
    const list = [];
    if (summary.premiere_date_negative) {
      const d = new Date(summary.premiere_date_negative);
      const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
      list.push({
        tone: "danger",
        text: `Votre trésorerie sera négative dans ${days} jour${days > 1 ? "s" : ""} (autour du ${d.toLocaleDateString("fr-FR")}).`,
      });
    }
    if (summary.montant_recuperable > 0) {
      list.push({
        tone: "yellow",
        text: `${summary.clients_en_retard} client(s) en retard de paiement. Montant récupérable : ${formatFCFA(summary.montant_recuperable)}.`,
      });
    }
    if (!summary.premiere_date_negative && summary.solde_previsionnel > summary.solde_actuel) {
      list.push({
        tone: "green",
        text: `Votre trésorerie progresse sainement sur cette période (+${formatFCFA(summary.solde_previsionnel - summary.solde_actuel)}).`,
      });
    }
    if (list.length === 0) {
      list.push({ tone: "blue", text: "Pas d'alerte particulière sur cette période." });
    }
    return list;
  }, [summary]);

  function handleSaveRecurring(tx) {
    createRecurring.mutate(tx, { onSuccess: () => setShowModal(false) });
  }

  function handleSaveBalance() {
    if (balanceInput === null || balanceInput === "") return;
    updateBalance.mutate(Number(balanceInput), { onSuccess: () => setBalanceInput(null) });
  }

  function handleAsk() {
    const q = question.trim();
    if (!q || askAssistant.isPending) return;
    askAssistant.mutate(q, {
      onSuccess: (answer) => {
        setChatHistory((h) => [...h, { question: q, answer }]);
        setQuestion("");
      },
      onError: (err) => {
        setChatHistory((h) => [...h, { question: q, answer: "Erreur : " + err.message }]);
      },
    });
  }

  function handleExportCsv() {
    if (!forecast) return;
    const rows = [["Date", "Entrées", "Sorties", "Net", "Solde prévisionnel"]];
    forecast.forEach((f) => {
      rows.push([f.forecast_date, f.inflow, f.outflow, f.daily_net, f.projected_balance]);
    });
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `previsions-tresorerie-${days}j.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const toneColors = {
    danger: { bg: palette.danger[50], border: palette.danger[100], dot: palette.danger.solid },
    yellow: { bg: "#fffbeb", border: "#fde68a", dot: "#d97706" },
    green: { bg: palette.green[50], border: palette.green[100], dot: palette.green.solid },
    blue: { bg: palette.primary[50], border: palette.primary[100], dot: palette.primary.solid },
  };

  return (
    <>
      {showModal && (
        <RecurringTransactionModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveRecurring}
          saving={createRecurring.isPending}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <Header title="Prévisions de trésorerie" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{
            padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            fontSize: 13, fontWeight: 600, fontFamily: font, color: colors.gray[700], background: colors.white,
          }}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={handleExportCsv} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: colors.white, color: colors.gray[700],
            border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
          }}>
            <Download size={15} /> Exporter
          </button>
          <button onClick={() => setShowModal(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
            border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
          }}>
            <Plus size={15} /> Transaction récurrente
          </button>
        </div>
      </div>

      {loadingSummary ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
        </div>
      ) : (
        <>
          {/* Cartes KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 8 }}>
            <KpiCard icon={Wallet} iconBg={palette.primary[50]} iconColor={palette.primary.solid}
              label="Solde actuel" value={formatFCFA(summary?.solde_actuel)} />
            <KpiCard icon={TrendingUp} iconBg={palette.green[50]} iconColor={palette.green.solid}
              label="Entrées prévues" value={formatFCFA(summary?.entrees_prevues)} />
            <KpiCard icon={TrendingDown} iconBg={palette.danger[50]} iconColor={palette.danger.solid}
              label="Sorties prévues" value={formatFCFA(summary?.sorties_prevues)} />
            <KpiCard icon={Wallet} iconBg={palette.primary[50]} iconColor={palette.primary.solid}
              label={`Solde dans ${days} jours`} value={formatFCFA(summary?.solde_previsionnel)}
              sub={summary?.premiere_date_negative ? "Risque de trésorerie négative" : undefined}
              subColor={palette.danger.solid} />
          </div>

          {/* Modifier le solde actuel */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {balanceInput === null ? (
              <button onClick={() => setBalanceInput(String(summary?.solde_actuel ?? 0))} style={{
                border: "none", background: "none", color: palette.primary.solid, fontSize: 12.5,
                fontWeight: 700, cursor: "pointer", fontFamily: font, padding: 0,
              }}>
                Mettre à jour le solde actuel
              </button>
            ) : (
              <>
                <input type="number" value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    fontSize: 13, fontFamily: font, width: 160 }} />
                <button onClick={handleSaveBalance} disabled={updateBalance.isPending} style={{
                  padding: "7px 12px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
                  color: colors.white, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: font,
                }}>Enregistrer</button>
                <button onClick={() => setBalanceInput(null)} style={{
                  padding: "7px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  background: colors.white, color: colors.gray[600], fontSize: 12.5, fontWeight: 700,
                  cursor: "pointer", fontFamily: font,
                }}>Annuler</button>
              </>
            )}
          </div>

          {/* Graphique + Assistant */}
          <div className="ff-row3" style={{ marginTop: 12 }}>
            <Card style={{ flex: 1.6, minWidth: 280 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
                Courbe de trésorerie
              </p>
              {loadingForecast ? (
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="soldeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={palette.primary.solid} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={palette.primary.solid} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[100]} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.gray[500] }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: colors.gray[500] }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => (v / 1000000).toFixed(1) + "M"} />
                    <Tooltip formatter={(v) => formatFCFA(v)} />
                    <Area type="monotone" dataKey="solde" stroke={palette.primary.solid} strokeWidth={2}
                      fill="url(#soldeGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: radius.md, background: colors.gray[900],
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={15} color={colors.white} />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Assistant Trésorerie</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {insights.map((ins, i) => {
                  const t = toneColors[ins.tone];
                  return (
                    <div key={i} style={{ background: t.bg, border: "1px solid " + t.border, borderRadius: radius.md,
                      padding: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot, marginTop: 5, flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[700], lineHeight: 1.5 }}>{ins.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Historique des questions/réponses */}
              {chatHistory.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12,
                  maxHeight: 220, overflowY: "auto" }}>
                  {chatHistory.map((h, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.gray[900],
                        background: colors.gray[100], borderRadius: radius.md, padding: "6px 10px",
                        alignSelf: "flex-end", maxWidth: "85%" }}>
                        {h.question}
                      </p>
                      <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[700], lineHeight: 1.5,
                        background: palette.primary[50], borderRadius: radius.md, padding: "8px 10px",
                        maxWidth: "95%" }}>
                        {h.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Champ de question */}
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  placeholder="Ex: Vais-je manquer de trésorerie ?"
                  style={{ flex: 1, padding: "9px 12px", borderRadius: radius.md,
                    border: "1px solid " + colors.gray[200], fontSize: 12.5, fontFamily: font,
                    color: colors.gray[900], outline: "none" }}
                />
                <button onClick={handleAsk} disabled={askAssistant.isPending || !question.trim()} style={{
                  padding: "9px 14px", borderRadius: radius.md, border: "none",
                  background: question.trim() && !askAssistant.isPending ? palette.primary.solid : colors.gray[200],
                  color: question.trim() && !askAssistant.isPending ? colors.white : colors.gray[400],
                  cursor: question.trim() && !askAssistant.isPending ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {askAssistant.isPending ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                </button>
              </div>
            </Card>
          </div>

          {/* Transactions récurrentes */}
          <Card style={{ marginTop: 12 }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
              Transactions récurrentes
            </p>
            {loadingRecurring ? (
              <Loader2 size={16} color={palette.primary.solid} className="animate-spin" />
            ) : !recurring || recurring.length === 0 ? (
              <p style={{ fontSize: 12.5, color: colors.gray[500], textAlign: "center", padding: "20px 0" }}>
                Aucune transaction récurrente. Ajoutez vos salaires, abonnements ou dépenses fixes.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recurring.map((tx) => (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: radius.md, border: "1px solid " + colors.gray[100], flexWrap: "wrap" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%",
                      background: tx.type === "income" ? palette.green.solid : palette.danger.solid, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{tx.label}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: colors.gray[500] }}>
                        {CATEGORY_LABELS[tx.category] || tx.category} · {tx.frequency === "monthly" ? "Mensuelle" : tx.frequency === "weekly" ? "Hebdomadaire" : "Annuelle"}
                      </p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
                      color: tx.type === "income" ? palette.green.solid : palette.danger.solid }}>
                      {tx.type === "income" ? "+" : "-"}{formatFCFA(tx.amount)}
                    </p>
                    <button onClick={() => toggleRecurring.mutate({ id: tx.id, isActive: !tx.is_active })} style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: radius.full, border: "none",
                      cursor: "pointer", background: tx.is_active ? palette.green[50] : colors.gray[100],
                      color: tx.is_active ? palette.green.solid : colors.gray[500],
                    }}>
                      {tx.is_active ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => confirm("Supprimer cette transaction ?") && deleteRecurring.mutate(tx.id)}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                      <Trash2 size={15} color={palette.danger.solid} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}