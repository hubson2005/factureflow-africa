import { useState } from "react";
import { Calculator, Plus, Loader2, ScrollText, Scale, ShieldCheck, Trash2, FileBarChart, Landmark } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useCompany } from "../hooks/useCompany";
import {
  useChartOfAccounts, useInitializeAccounting, useJournalEntries, useTrialBalance,
  useCreateManualJournalEntry, useAccountingJournals, useSetAccountingSystem,
  useIncomeExpenseStatement, useBalanceSheet, useIncomeStatement,
} from "../modules/accounting/useAccounting";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

function fmt(n) {
  return Math.round(Number(n)).toLocaleString("fr-FR");
}

export default function Accounting() {
  const { data: company } = useCompany();
  const { data: accounts, isLoading: accountsLoading } = useChartOfAccounts();
  const { data: journals } = useAccountingJournals();
  const { data: entries, isLoading: entriesLoading } = useJournalEntries();
  const { data: balance, isLoading: balanceLoading } = useTrialBalance();
  const initAccounting = useInitializeAccounting();
  const setAccountingSystem = useSetAccountingSystem();
  const [tab, setTab] = useState("journal");
  const [showEntryForm, setShowEntryForm] = useState(false);

  const isInitialized = !accountsLoading && (accounts || []).length > 0;
  const canManage = company?.role === "admin" || company?.role === "comptable";
  const isSMT = company?.companies?.accounting_system !== "normal";

  if (accountsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
        <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
        <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <>
        <Header title="Comptabilité" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
          padding: "56px 20px", background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, marginTop: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: radius.md, background: palette.primary[50],
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calculator size={22} color={palette.primary.solid} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Comptabilité non activée</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: colors.gray[600], maxWidth: 420 }}>
              Active la comptabilite pour generer automatiquement les ecritures
              (plan comptable SYSCOHADA, journaux, exercice fiscal en cours). Les
              factures emises et paiements encaisses seront alors comptabilises
              automatiquement.
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 11.5, color: colors.gray[500], maxWidth: 420, lineHeight: 1.5 }}>
              Le plan comptable et les comptes par defaut sont une premiere
              base de travail (Phase 1) — a faire valider par un expert-comptable
              avant toute utilisation officielle (declarations fiscales, DSF).
            </p>
          </div>
          {canManage ? (
            <button onClick={() => initAccounting.mutate()} disabled={initAccounting.isPending} style={{
              marginTop: 4, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
              borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
              opacity: initAccounting.isPending ? 0.6 : 1 }}>
              {initAccounting.isPending ? <><Loader2 size={15} className="animate-spin" /> Activation...</> : "Activer la comptabilité"}
            </button>
          ) : (
            <p style={{ fontSize: 12, color: colors.gray[500] }}>Seul un administrateur ou comptable peut activer ce module.</p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {showEntryForm && <ManualEntryForm onClose={() => setShowEntryForm(false)} journals={journals || []} accounts={accounts || []} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <Header title="Comptabilité" />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {canManage && (
            <select value={company?.companies?.accounting_system || "smt"}
              onChange={(e) => setAccountingSystem.mutate(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 12.5, fontFamily: font, outline: "none", background: colors.white }}>
              <option value="smt">Régime SMT</option>
              <option value="normal">Régime Système Normal</option>
            </select>
          )}
          {canManage && (
            <button onClick={() => setShowEntryForm(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
              <Plus size={15} /> Écriture manuelle
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, marginTop: 12, borderBottom: "1px solid " + colors.gray[200], flexWrap: "wrap" }}>
        {[
          { id: "journal", label: "Journal", icon: ScrollText },
          { id: "balance", label: "Balance générale", icon: Scale },
          isSMT
            ? { id: "recettes", label: "Recettes / Dépenses", icon: FileBarChart }
            : { id: "bilan", label: "Bilan", icon: Landmark },
          !isSMT && { id: "resultat", label: "Compte de résultat", icon: FileBarChart },
        ].filter(Boolean).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", border: "none", background: "none",
            cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 700,
            color: tab === t.id ? palette.primary.solid : colors.gray[500],
            borderBottom: tab === t.id ? "2px solid " + palette.primary.solid : "2px solid transparent", marginBottom: -1 }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "journal" ? (
        entriesLoading ? (
          <Loader2 size={18} className="animate-spin" color={palette.primary.solid} />
        ) : (entries || []).length === 0 ? (
          <EmptyPanel text="Aucune écriture pour le moment. Les prochaines factures émises et paiements enregistrés seront comptabilisés automatiquement." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map((e) => <EntryCard key={e.id} entry={e} />)}
          </div>
        )
      ) : tab === "balance" ? (
        balanceLoading ? <Loader2 size={18} className="animate-spin" color={palette.primary.solid} /> : <TrialBalanceTable balance={balance || []} />
      ) : tab === "recettes" ? (
        <IncomeExpenseStatementPanel />
      ) : tab === "bilan" ? (
        <BalanceSheetPanel />
      ) : (
        <IncomeStatementPanel />
      )}
    </>
  );
}

function EmptyPanel({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", background: colors.white,
      border: "1px solid " + colors.gray[200], borderRadius: radius.lg }}>
      <p style={{ margin: 0, fontSize: 13, color: colors.gray[500], maxWidth: 380, marginInline: "auto" }}>{text}</p>
    </div>
  );
}

const SOURCE_LABELS = { invoice: "Vente", payment: "Encaissement", expense: "Dépense", purchase: "Achat", manual: "Manuelle", opening_balance: "À nouveau" };

function EntryCard({ entry }) {
  const total = (entry.lines || []).reduce((s, l) => s + Number(l.debit), 0);
  return (
    <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: colors.gray[900] }}>{entry.label}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[500] }}>
            {new Date(entry.entry_date).toLocaleDateString("fr-FR")} · Journal {entry.journal?.code} · {SOURCE_LABELS[entry.source_type] || entry.source_type}
          </p>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>{fmt(total)} FCFA</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {(entry.lines || []).map((l) => (
          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0",
            borderTop: "1px solid " + colors.gray[100] }}>
            <span style={{ color: colors.gray[700] }}>{l.account?.account_number} — {l.account?.label}</span>
            <span style={{ color: colors.gray[600] }}>
              {Number(l.debit) > 0 ? "Débit " + fmt(l.debit) : "Crédit " + fmt(l.credit)} FCFA
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IncomeExpenseStatementPanel() {
  const { data, isLoading } = useIncomeExpenseStatement();
  if (isLoading) return <Loader2 size={18} className="animate-spin" color={palette.primary.solid} />;
  if (!data || data.lines.length === 0) return <EmptyPanel text="Aucun mouvement de trésorerie enregistré pour le moment." />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <SummaryCard label="Recettes" value={data.totalRecettes} color={palette.green} />
        <SummaryCard label="Dépenses" value={data.totalDepenses} color={palette.danger} />
        <SummaryCard label="Solde" value={data.solde} color={data.solde >= 0 ? palette.green : palette.danger} highlight />
      </div>
      <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, overflow: "hidden" }}>
        {data.lines.map((l) => (
          <div key={l.category} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px",
            borderBottom: "1px solid " + colors.gray[100] }}>
            <span style={{ fontSize: 13, color: colors.gray[900], fontWeight: 600, textTransform: "capitalize" }}>{l.category}</span>
            <span style={{ fontSize: 13, color: colors.gray[600] }}>
              {l.recettes > 0 && <span style={{ color: palette.green.text }}>+{fmt(l.recettes)}</span>}
              {l.recettes > 0 && l.depenses > 0 && "  ·  "}
              {l.depenses > 0 && <span style={{ color: palette.danger.solid }}>-{fmt(l.depenses)}</span>} FCFA
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalanceSheetPanel() {
  const { data, isLoading } = useBalanceSheet();
  if (isLoading) return <Loader2 size={18} className="animate-spin" color={palette.primary.solid} />;
  if (!data || (data.actif.length === 0 && data.passif.length === 0)) return <EmptyPanel text="Aucune écriture pour établir un bilan." />;
  const isBalanced = Math.abs(data.totalActif - data.totalPassif) < 0.01;

  return (
    <div>
      <BalanceBadge isBalanced={isBalanced} labelOk="Bilan équilibré" labelKo="Bilan déséquilibré — anomalie à signaler" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AccountColumn title="Actif" rows={data.actif} total={data.totalActif} />
        <AccountColumn title="Passif" rows={data.passif} total={data.totalPassif} />
      </div>
    </div>
  );
}

function IncomeStatementPanel() {
  const { data, isLoading } = useIncomeStatement();
  if (isLoading) return <Loader2 size={18} className="animate-spin" color={palette.primary.solid} />;
  if (!data || (data.charges.length === 0 && data.produits.length === 0)) return <EmptyPanel text="Aucune écriture pour établir un compte de résultat." />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <SummaryCard label="Produits" value={data.totalProduits} color={palette.green} />
        <SummaryCard label="Charges" value={data.totalCharges} color={palette.danger} />
        <SummaryCard label="Résultat net" value={data.resultat} color={data.resultat >= 0 ? palette.green : palette.danger} highlight />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AccountColumn title="Charges" rows={data.charges.map((c) => ({ ...c, solde: c.montant }))} total={data.totalCharges} />
        <AccountColumn title="Produits" rows={data.produits.map((p) => ({ ...p, solde: p.montant }))} total={data.totalProduits} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, highlight }) {
  return (
    <div style={{ background: highlight ? color.solid : colors.white, border: highlight ? "none" : "1px solid " + colors.gray[200],
      borderRadius: radius.lg, padding: 14 }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: highlight ? "rgba(255,255,255,0.85)" : colors.gray[500], textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 800, color: highlight ? colors.white : colors.gray[900] }}>
        {value >= 0 ? "" : "-"}{fmt(Math.abs(value))} FCFA
      </p>
    </div>
  );
}

function BalanceBadge({ isBalanced, labelOk, labelKo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "8px 12px",
      borderRadius: radius.md, background: isBalanced ? palette.green[50] : palette.danger[50],
      color: isBalanced ? palette.green.text : palette.danger.solid, fontSize: 12, fontWeight: 600, width: "fit-content" }}>
      <ShieldCheck size={14} />
      {isBalanced ? labelOk : labelKo}
    </div>
  );
}

function AccountColumn({ title, rows, total }) {
  return (
    <div>
      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: colors.gray[600], textTransform: "uppercase" }}>{title}</p>
      <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, overflow: "hidden" }}>
        {rows.map((r) => (
          <div key={r.account_number} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px",
            borderBottom: "1px solid " + colors.gray[100] }}>
            <span style={{ fontSize: 12.5, color: colors.gray[900] }}>{r.account_number} — {r.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[900] }}>{fmt(r.solde)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: colors.gray[50] }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.gray[700] }}>Total</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.gray[700] }}>{fmt(total)} FCFA</span>
        </div>
      </div>
    </div>
  );
}

function TrialBalanceTable({ balance }) {
  const totalDebit = balance.reduce((s, a) => s + a.totalDebit, 0);
  const totalCredit = balance.reduce((s, a) => s + a.totalCredit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "8px 12px",
        borderRadius: radius.md, background: isBalanced ? palette.green[50] : palette.danger[50],
        color: isBalanced ? palette.green.text : palette.danger.solid, fontSize: 12, fontWeight: 600, width: "fit-content" }}>
        <ShieldCheck size={14} />
        {isBalanced ? "Balance équilibrée" : "Balance déséquilibrée — anomalie à signaler"}
      </div>
      <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, overflow: "hidden" }}>
        {balance.map((a) => {
          const solde = a.totalDebit - a.totalCredit;
          return (
            <div key={a.account_number} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 16px", borderBottom: "1px solid " + colors.gray[100] }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{a.account_number} — {a.label}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: solde >= 0 ? colors.gray[900] : palette.danger.solid }}>
                {solde >= 0 ? "" : "-"}{fmt(Math.abs(solde))} FCFA
              </span>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: colors.gray[50] }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.gray[700] }}>Total débit / crédit</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.gray[700] }}>{fmt(totalDebit)} / {fmt(totalCredit)} FCFA</span>
        </div>
      </div>
    </div>
  );
}

function ManualEntryForm({ onClose, journals, accounts }) {
  const createEntry = useCreateManualJournalEntry();
  const [journalCode, setJournalCode] = useState(journals.find((j) => j.code === "OD")?.code || journals[0]?.code || "");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState("");
  const [lines, setLines] = useState([
    { id: "1", accountNumber: "", side: "debit", amount: 0 },
    { id: "2", accountNumber: "", side: "credit", amount: 0 },
  ]);

  const totalDebit = lines.filter((l) => l.side === "debit").reduce((s, l) => s + Number(l.amount || 0), 0);
  const totalCredit = lines.filter((l) => l.side === "credit").reduce((s, l) => s + Number(l.amount || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const isValid = isBalanced && label.trim() && lines.every((l) => l.accountNumber);

  function updateLine(id, field, value) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }
  function addLine() { setLines((prev) => [...prev, { id: Date.now().toString(), accountNumber: "", side: "debit", amount: 0 }]); }
  function removeLine(id) { setLines((prev) => prev.filter((l) => l.id !== id)); }

  function handleSubmit() {
    if (!isValid) return;
    const payload = lines.map((l) => ({
      account_number: l.accountNumber,
      debit: l.side === "debit" ? Number(l.amount) : 0,
      credit: l.side === "credit" ? Number(l.amount) : 0,
    }));
    createEntry.mutate({ journalCode, entryDate, label, lines: payload }, {
      onSuccess: onClose,
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: colors.gray[50], borderRadius: radius.lg, width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto", boxShadow: shadow.hover }}>
        <div style={{ padding: "16px 20px", background: colors.white, borderBottom: "1px solid " + colors.gray[100] }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Écriture manuelle</p>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Journal</label>
              <select value={journalCode} onChange={(e) => setJournalCode(e.target.value)}
                style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
                {journals.map((j) => <option key={j.code} value={j.code}>{j.code} — {j.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Date</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Libellé</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Régularisation..."
              style={{ width: "100%", marginTop: 4, padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }} />
          </div>

          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700, color: colors.gray[600], textTransform: "uppercase" }}>Lignes</p>
          {lines.map((l) => (
            <div key={l.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10, background: colors.white,
              borderRadius: radius.md, border: "1px solid " + colors.gray[200] }}>
              <select value={l.accountNumber} onChange={(e) => updateLine(l.id, "accountNumber", e.target.value)}
                style={{ padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 13, fontFamily: font, outline: "none", background: colors.white }}>
                <option value="">Choisir un compte...</option>
                {accounts.map((a) => <option key={a.account_number} value={a.account_number}>{a.account_number} — {a.label}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={l.side} onChange={(e) => updateLine(l.id, "side", e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    fontSize: 13, fontFamily: font, outline: "none", background: colors.white }}>
                  <option value="debit">Débit</option>
                  <option value="credit">Crédit</option>
                </select>
                <input type="number" min={0} value={l.amount} onChange={(e) => updateLine(l.id, "amount", e.target.value)}
                  placeholder="Montant" style={{ flex: 1, padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    fontSize: 13, fontFamily: font, outline: "none" }} />
                {lines.length > 2 && (
                  <button onClick={() => removeLine(l.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 6 }}>
                    <Trash2 size={15} color={palette.danger.solid} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={addLine} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
            borderRadius: radius.md, border: "1px dashed " + colors.gray[300], background: "none", color: colors.gray[600],
            fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: font, alignSelf: "flex-start" }}>
            <Plus size={13} /> Ajouter une ligne
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", fontSize: 12.5,
            color: isBalanced ? palette.green.text : palette.danger.solid, fontWeight: 700 }}>
            <span>Débit : {fmt(totalDebit)} FCFA</span>
            <span>Crédit : {fmt(totalCredit)} FCFA</span>
          </div>
        </div>

        <div style={{ display: "flex", padding: "16px 20px", background: colors.white, borderTop: "1px solid " + colors.gray[100], gap: 8 }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!isValid || createEntry.isPending} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 16px", borderRadius: radius.md, border: "none",
            background: isValid && !createEntry.isPending ? palette.primary.solid : colors.gray[200],
            color: isValid && !createEntry.isPending ? colors.white : colors.gray[400],
            fontSize: 13, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed", fontFamily: font }}>
            {createEntry.isPending ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : "Enregistrer l'écriture"}
          </button>
        </div>
      </div>
    </div>
  );
}
