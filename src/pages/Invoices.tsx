import React, { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useInvoices, useCreateInvoice, useRecordPayment } from "../modules/invoices/useInvoices";
import { InvoicesToolbar } from "../modules/invoices/components/InvoicesToolbar";
import type { StatusFilter } from "../modules/invoices/components/InvoicesToolbar";
import { InvoiceCard } from "../modules/invoices/components/InvoiceCard";
import { NewInvoiceForm } from "../modules/invoices/components/NewInvoiceForm";
import ComplianceScoreBadge from '../components/ComplianceScoreBadge';

export default function Invoices() {
  const { data: invoices, isLoading, isError } = useInvoices();
  const createInvoice = useCreateInvoice();
  const recordPayment = useRecordPayment();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("Toutes");
  const [showForm, setShowForm] = useState(false);

  const mapped = useMemo(() => {
    if (!invoices) return [];
    return invoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientName: inv.clients?.name ?? "Client",
      clientEmail: inv.clients?.email,
      clientPhone: inv.clients?.phone,
      total: Number(inv.total),
      amountDue: Number(inv.amount_due),
      status: inv.status,
      dueDate: inv.due_date,
      createdAt: inv.created_at,
      templateId: inv.template_id ?? null,
      items: inv.invoice_items || [],
      complianceStatus: inv.compliance_status,
    }));
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mapped.filter(inv => {
      const matchStatus = status === "Toutes" || inv.status === status;
      const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [mapped, search, status]);

  function handleSave(data: any) {
    createInvoice.mutate(data, {
      onSuccess: () => setShowForm(false),
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  function handleMarkPaid(id: string, amountDue: number) {
    if (amountDue <= 0) return;
    recordPayment.mutate({ invoiceId: id, amount: amountDue }, {
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  function handleRemind(id: string) { console.log("Relance:", id); }

  return (
    <>
      {showForm && <NewInvoiceForm onClose={()=>setShowForm(false)} onSave={handleSave} saving={createInvoice.isPending}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <Header title="Factures" />
        <button onClick={()=>setShowForm(true)} style={{
          display:"flex", alignItems:"center", gap:6, padding:"9px 14px",
          borderRadius:radius.md, background:palette.primary.solid, color:colors.white,
          border:"none", fontSize:13, fontWeight:700, cursor:"pointer",
          fontFamily:"'Inter',-apple-system,sans-serif", flexShrink:0 }}>
          <Plus size={15}/> Nouvelle Facture
        </button>
      </div>

      {isLoading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin"/>
          <span style={{ fontSize:13, color:colors.gray[600] }}>Chargement des factures...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign:"center", color:palette.danger.solid, fontSize:13, padding:"40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <>
          <InvoicesToolbar
            search={search} onSearchChange={setSearch}
            status={status} onStatusChange={setStatus}
            total={mapped.length} filteredCount={filtered.length}
          />
          <div style={{ marginTop:16 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign:"center", color:colors.gray[600], fontSize:13, padding:"40px 0" }}>
                {mapped.length === 0 ? "Aucune facture pour le moment. Creez votre premiere facture !" : "Aucun resultat."}
              </p>
            ) : filtered.map(inv => (
              <InvoiceCard key={inv.id} invoice={inv} onMarkPaid={handleMarkPaid} onRemind={handleRemind}/>
            ))}
          </div>
        </>
      )}
    </>
  );
}