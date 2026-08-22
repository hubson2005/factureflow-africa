import { useState } from "react";
import { UserPlus, Plus, Loader2, Wallet2, FileSpreadsheet } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useEmployees, useCreateEmployee, usePayslips, useCreatePayslip, usePayPayslip } from "../modules/hr/useHR";
import { useAccounts } from "../modules/treasury/useTreasury";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const STATUS_LABELS = { a_payer: "A payer", paye: "Paye" };

export default function HR() {
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: payslips, isLoading: payslipsLoading } = usePayslips();
  const { data: accounts } = useAccounts();
  const [tab, setTab] = useState("employees");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPayslipForm, setShowPayslipForm] = useState(false);

  const hasEmployee = !employeesLoading && (employees || []).length > 0;

  return (
    <>
      {showEmployeeForm && <EmployeeForm onClose={() => setShowEmployeeForm(false)} />}
      {showPayslipForm && <PayslipForm onClose={() => setShowPayslipForm(false)} employees={employees || []} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <Header title="Ressources humaines" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowEmployeeForm(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: colors.white, color: colors.gray[700],
            border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
            <UserPlus size={15} /> Employe
          </button>
          {hasEmployee && (
            <button onClick={() => setShowPayslipForm(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
              <Plus size={15} /> Bulletin de paie
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, marginTop: 12, borderBottom: "1px solid " + colors.gray[200] }}>
        {[{ id: "employees", label: "Employes" }, { id: "payslips", label: "Bulletins de paie" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: font,
            fontSize: 13, fontWeight: 700, color: tab === t.id ? palette.primary.solid : colors.gray[500],
            borderBottom: tab === t.id ? "2px solid " + palette.primary.solid : "2px solid transparent", marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "employees" ? (
        employeesLoading ? (
          <Loading />
        ) : !hasEmployee ? (
          <EmptyState
            icon={UserPlus}
            title="Aucun employe enregistre"
            text="Ajoutez vos employes pour commencer a generer des bulletins de paie."
            cta="Ajouter un employe"
            onClick={() => setShowEmployeeForm(true)}
          />
        ) : (
          <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 8, padding: "10px 16px",
              background: colors.gray[50], borderBottom: "1px solid " + colors.gray[200] }}>
              {["Nom", "Poste", "Salaire mensuel", "Statut"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: colors.gray[600], textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {employees.map((e) => (
              <div key={e.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 8, padding: "12px 16px",
                borderBottom: "1px solid " + colors.gray[100], alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{e.first_name} {e.last_name}</span>
                <span style={{ fontSize: 13, color: colors.gray[700] }}>{e.position || "—"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
                  {Number(e.monthly_salary).toLocaleString("fr-FR")} FCFA
                </span>
                <span style={{
                  width: "fit-content", padding: "3px 9px", borderRadius: radius.full, fontSize: 11, fontWeight: 700,
                  background: e.status === "actif" ? palette.green[50] : colors.gray[100],
                  color: e.status === "actif" ? palette.green.text : colors.gray[600],
                }}>
                  {e.status === "actif" ? "Actif" : "Inactif"}
                </span>
              </div>
            ))}
          </div>
        )
      ) : payslipsLoading ? (
        <Loading />
      ) : !hasEmployee ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Aucun employe enregistre"
          text="Ajoutez d'abord un employe avant de generer un bulletin de paie."
          cta="Ajouter un employe"
          onClick={() => setShowEmployeeForm(true)}
        />
      ) : (payslips || []).length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Aucun bulletin de paie"
          text="Generez le premier bulletin de paie du mois pour un employe."
          cta="Creer un bulletin"
          onClick={() => setShowPayslipForm(true)}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {payslips.map((p) => (
            <PayslipCard key={p.id} payslip={p} accounts={accounts || []} />
          ))}
        </div>
      )}
    </>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
      <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
      <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, cta, onClick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
      padding: "56px 20px", background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg }}>
      <div style={{ width: 48, height: 48, borderRadius: radius.md, background: palette.primary[50],
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color={palette.primary.solid} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: colors.gray[600], maxWidth: 340 }}>{text}</p>
      </div>
      <button onClick={onClick} style={{
        marginTop: 4, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
        borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
        <Plus size={15} /> {cta}
      </button>
    </div>
  );
}

function PayslipCard({ payslip, accounts }) {
  const payPayslip = usePayPayslip();
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const isPaid = payslip.status === "paye";

  function handlePay() {
    payPayslip.mutate({ payslipId: payslip.id, accountId }, { onError: (err) => alert("Erreur : " + err.message) });
  }

  return (
    <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, padding: 16,
      display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
          {payslip.employee?.first_name} {payslip.employee?.last_name}
          <span style={{ color: colors.gray[500], fontWeight: 500 }}> · {payslip.period}</span>
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: colors.gray[600] }}>
          Net : <strong style={{ color: colors.gray[900] }}>{Number(payslip.net_salary).toLocaleString("fr-FR")} FCFA</strong>
          {" "}(brut {Number(payslip.gross_salary).toLocaleString("fr-FR")}
          {Number(payslip.bonuses) > 0 && " + " + Number(payslip.bonuses).toLocaleString("fr-FR") + " prime"}
          {Number(payslip.deductions) > 0 && " - " + Number(payslip.deductions).toLocaleString("fr-FR") + " retenue"})
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ padding: "3px 10px", borderRadius: radius.full, fontSize: 11, fontWeight: 700,
          background: isPaid ? palette.green[50] : palette.yellow[50], color: isPaid ? palette.green.text : palette.yellow.text }}>
          {STATUS_LABELS[payslip.status]}
        </span>
        {!isPaid && accounts.length > 0 && (
          <>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 12, fontFamily: font, outline: "none" }}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button onClick={handlePay} disabled={payPayslip.isPending} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: radius.md,
              border: "none", background: palette.green.solid, color: colors.white, fontSize: 12, fontWeight: 700,
              cursor: payPayslip.isPending ? "not-allowed" : "pointer", fontFamily: font, opacity: payPayslip.isPending ? 0.6 : 1 }}>
              {payPayslip.isPending ? <Loader2 size={13} className="animate-spin" /> : <Wallet2 size={13} />}
              Payer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EmployeeForm({ onClose }) {
  const createEmployee = useCreateEmployee();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");

  const isValid = firstName.trim() && lastName.trim() && Number(monthlySalary) > 0;

  function handleSubmit() {
    if (!isValid) return;
    createEmployee.mutate({ firstName, lastName, position, monthlySalary: Number(monthlySalary) }, {
      onSuccess: onClose, onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, width: "100%", maxWidth: 380, boxShadow: shadow.lg }}>
        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouvel employe</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Prenom *</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              style={{ width: "100%", marginTop: 4, padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Nom *</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)}
              style={{ width: "100%", marginTop: 4, padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Poste</label>
        <input value={position} onChange={(e) => setPosition(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Salaire mensuel (brut) *</label>
        <input type="number" min={0} value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 16, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Annuler</button>
          <button onClick={handleSubmit} disabled={createEmployee.isPending || !isValid} style={{
            padding: "9px 14px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
            color: colors.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
            opacity: createEmployee.isPending || !isValid ? 0.6 : 1 }}>
            {createEmployee.isPending ? "Creation..." : "Creer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayslipForm({ onClose, employees }) {
  const createPayslip = useCreatePayslip();
  const now = new Date();
  const defaultPeriod = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [period, setPeriod] = useState(defaultPeriod);
  const [grossSalary, setGrossSalary] = useState(employees[0]?.monthly_salary || "");
  const [bonuses, setBonuses] = useState("0");
  const [deductions, setDeductions] = useState("0");

  function handleEmployeeChange(id) {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) setGrossSalary(emp.monthly_salary);
  }

  const isValid = employeeId && period && Number(grossSalary) > 0;

  function handleSubmit() {
    if (!isValid) return;
    createPayslip.mutate({ employeeId, period, grossSalary: Number(grossSalary), bonuses: Number(bonuses), deductions: Number(deductions) }, {
      onSuccess: onClose,
      onError: (err) => alert("Erreur : " + (err.message.includes("duplicate") ? "Un bulletin existe deja pour cet employe sur cette periode." : err.message)),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, width: "100%", maxWidth: 380, boxShadow: shadow.lg }}>
        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouveau bulletin de paie</p>

        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Employe</label>
        <select value={employeeId} onChange={(e) => handleEmployeeChange(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 10px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
        </select>

        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Periode (AAAA-MM)</label>
        <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-08"
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600] }}>Brut</label>
            <input type="number" min={0} value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)}
              style={{ width: "100%", marginTop: 4, padding: "9px 8px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 12.5, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600] }}>Prime</label>
            <input type="number" min={0} value={bonuses} onChange={(e) => setBonuses(e.target.value)}
              style={{ width: "100%", marginTop: 4, padding: "9px 8px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 12.5, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600] }}>Retenue</label>
            <input type="number" min={0} value={deductions} onChange={(e) => setDeductions(e.target.value)}
              style={{ width: "100%", marginTop: 4, padding: "9px 8px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 12.5, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <p style={{ margin: "-8px 0 16px", fontSize: 12.5, color: colors.gray[700] }}>
          Net : <strong>{(Number(grossSalary || 0) + Number(bonuses || 0) - Number(deductions || 0)).toLocaleString("fr-FR")} FCFA</strong>
        </p>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Annuler</button>
          <button onClick={handleSubmit} disabled={createPayslip.isPending || !isValid} style={{
            padding: "9px 14px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
            color: colors.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
            opacity: createPayslip.isPending || !isValid ? 0.6 : 1 }}>
            {createPayslip.isPending ? "Creation..." : "Creer"}
          </button>
        </div>
      </div>
    </div>
  );
}
