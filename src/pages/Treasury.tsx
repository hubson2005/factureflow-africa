import { useState } from "react";
import { Landmark, Plus, Loader2, ArrowDownCircle, ArrowUpCircle, Wallet2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import {
  useAccounts, useCreateAccount, useTreasuryTransactions, useCreateTreasuryTransaction,
  usePendingPurchasePayments, useMarkPurchasePaid,
} from "../modules/treasury/useTreasury";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const CATEGORY_LABELS = { vente: "Vente", achat: "Achat", salaire: "Salaire", charge: "Charge", autre: "Autre" };

export default function Treasury() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: transactions, isLoading: txLoading } = useTreasuryTransactions();
  const { data: pendingPurchases } = usePendingPurchasePayments();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);

  const hasAccount = !accountsLoading && (accounts || []).length > 0;
  const totalBalance = (accounts || []).reduce((s, a) => s + Number(a.balance), 0);

  return (
    <>
      {showAccountForm && <AccountForm onClose={() => setShowAccountForm(false)} isFirst={!hasAccount} />}
      {showTxForm && <TransactionForm onClose={() => setShowTxForm(false)} accounts={accounts || []} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <Header title="Tresorerie" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAccountForm(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: colors.white, color: colors.gray[700],
            border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
            <Plus size={15} /> Compte
          </button>
          {hasAccount && (
            <button onClick={() => setShowTxForm(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
              <Plus size={15} /> Mouvement
            </button>
          )}
        </div>
      </div>

      {accountsLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
        </div>
      ) : !hasAccount ? (
        <EmptyState onCreate={() => setShowAccountForm(true)} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
            <div style={{ background: palette.primary.solid, borderRadius: radius.lg, padding: 16 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>Solde total</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: colors.white }}>
                {Math.round(totalBalance).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
            {(accounts || []).map((a) => (
              <div key={a.id} style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, padding: 16 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: colors.gray[500], textTransform: "uppercase" }}>{a.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: colors.gray[900] }}>
                  {Math.round(Number(a.balance)).toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            ))}
          </div>

          {(pendingPurchases || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: colors.gray[600], textTransform: "uppercase" }}>
                Achats a payer
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingPurchases.map((p) => (
                  <PendingPurchaseRow key={p.id} purchase={p} accounts={accounts || []} />
                ))}
              </div>
            </div>
          )}

          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: colors.gray[600], textTransform: "uppercase" }}>
            Journal des transactions
          </p>
          {txLoading ? (
            <Loader2 size={16} className="animate-spin" color={palette.primary.solid} />
          ) : (transactions || []).length === 0 ? (
            <p style={{ fontSize: 13, color: colors.gray[500], padding: "20px 0" }}>Aucune transaction pour le moment.</p>
          ) : (
            <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, overflow: "hidden" }}>
              {transactions.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", borderBottom: "1px solid " + colors.gray[100] }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {t.type === "encaissement"
                      ? <ArrowDownCircle size={17} color={palette.green.solid} />
                      : <ArrowUpCircle size={17} color={palette.danger.solid} />}
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
                        {t.description || CATEGORY_LABELS[t.category] || t.category}
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: colors.gray[500] }}>
                        {t.account?.name} · {CATEGORY_LABELS[t.category] || t.category}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.type === "encaissement" ? palette.green.text : palette.danger.solid }}>
                    {t.type === "encaissement" ? "+" : "-"}{Math.round(Number(t.amount)).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
      padding: "56px 20px", background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg }}>
      <div style={{ width: 48, height: 48, borderRadius: radius.md, background: palette.primary[50],
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Landmark size={22} color={palette.primary.solid} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Aucun compte de tresorerie</p>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: colors.gray[600], maxWidth: 340 }}>
          Creez votre premier compte (caisse, banque, mobile money). Une fois
          configure comme compte par defaut, les paiements clients et les
          depenses y sont enregistres automatiquement.
        </p>
      </div>
      <button onClick={onCreate} style={{
        marginTop: 4, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
        borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
        <Plus size={15} /> Creer un compte
      </button>
    </div>
  );
}

function PendingPurchaseRow({ purchase, accounts }) {
  const markPaid = useMarkPurchasePaid();
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");

  function handlePay() {
    markPaid.mutate({ purchaseId: purchase.id, accountId }, { onError: (err) => alert("Erreur : " + err.message) });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
      background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.md, padding: "10px 14px" }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
          {purchase.supplier?.name}{purchase.reference && " · " + purchase.reference}
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 12, color: colors.gray[500] }}>
          {Math.round(purchase.total).toLocaleString("fr-FR")} FCFA
        </p>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            fontSize: 12, fontFamily: font, outline: "none" }}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={handlePay} disabled={markPaid.isPending} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: radius.md,
          border: "none", background: palette.green.solid, color: colors.white, fontSize: 12, fontWeight: 700,
          cursor: markPaid.isPending ? "not-allowed" : "pointer", fontFamily: font, opacity: markPaid.isPending ? 0.6 : 1 }}>
          {markPaid.isPending ? <Loader2 size={13} className="animate-spin" /> : <Wallet2 size={13} />}
          Marquer paye
        </button>
      </div>
    </div>
  );
}

function AccountForm({ onClose, isFirst }) {
  const createAccount = useCreateAccount();
  const [name, setName] = useState(isFirst ? "Caisse principale" : "");
  const [type, setType] = useState("especes");

  function handleSubmit() {
    if (!name.trim()) return;
    createAccount.mutate({ name, type, isDefault: isFirst }, { onSuccess: onClose, onError: (err) => alert("Erreur : " + err.message) });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, width: "100%", maxWidth: 380, boxShadow: shadow.lg }}>
        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>
          {isFirst ? "Creer votre premier compte" : "Nouveau compte"}
        </p>
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Nom</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Caisse principale"
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 16, padding: "9px 10px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
          <option value="especes">Especes</option>
          <option value="bancaire">Bancaire</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
        {isFirst && (
          <p style={{ margin: "0 0 16px", fontSize: 11.5, color: colors.gray[500] }}>
            Ce compte sera defini par defaut : les paiements clients et depenses
            y seront enregistres automatiquement.
          </p>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Annuler</button>
          <button onClick={handleSubmit} disabled={createAccount.isPending || !name.trim()} style={{
            padding: "9px 14px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
            color: colors.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
            opacity: createAccount.isPending || !name.trim() ? 0.6 : 1 }}>
            {createAccount.isPending ? "Creation..." : "Creer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionForm({ onClose, accounts }) {
  const createTx = useCreateTreasuryTransaction();
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [type, setType] = useState("encaissement");
  const [category, setCategory] = useState("autre");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit() {
    if (!accountId || !amount) return;
    createTx.mutate({ accountId, type, amount: Number(amount), category, description }, {
      onSuccess: onClose,
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, width: "100%", maxWidth: 380, boxShadow: shadow.lg }}>
        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Mouvement manuel</p>

        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Compte</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 10px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
              <option value="encaissement">Encaissement</option>
              <option value="decaissement">Decaissement</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Categorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Montant</label>
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />

        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Description (optionnel)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 16, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Annuler</button>
          <button onClick={handleSubmit} disabled={createTx.isPending || !accountId || !amount} style={{
            padding: "9px 14px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
            color: colors.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
            opacity: createTx.isPending || !accountId || !amount ? 0.6 : 1 }}>
            {createTx.isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
