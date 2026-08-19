import React, { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { palette, colors, radius } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useInvoices, useCreateInvoice, useRecordPayment, useSendInvoiceReminder, useCancelInvoice } from "../modules/invoices/useInvoices";
import { useCompany } from "../hooks/useCompany";
import { InvoicesToolbar } from "../modules/invoices/components/InvoicesToolbar";
import type { StatusFilter } from "../modules/invoices/components/InvoicesToolbar";
import { InvoiceCard } from "../modules/invoices/components/InvoiceCard";
import { NewInvoiceForm } from "../modules/invoices/components/NewInvoiceForm";
import ComplianceScoreBadge from '../components/ComplianceScoreBadge';
import { useAutoOpenCreate } from "@/hooks/useAutoOpenCreate";

export default function Invoices() {
  const { data: invoices, isLoading, isError } = useInvoices();
  const { data: company } = useCompany();
  // La FNE (Facture Normalisee Electronique) est specifique a la DGI ivoirienne.
  // Le bouton/visuel de certification ne doit apparaitre que pour ce pays,
  // sinon on afficherait une option DGI a des entreprises du Senegal/Benin/
  // Burkina Faso pour lesquelles elle n'a aucun sens.
  const isCotedivoire = company?.companies?.country_code === "CI";
  const createInvoice = useCreateInvoice();
  const recordPayment = useRecordPayment();
  const sendReminder = useSendInvoiceReminder();
  const cancelInvoice = useCancelInvoice();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("Toutes");
  const [showForm, setShowForm] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Ouvre automatiquement ce formulaire si on arrive ici via le bouton "+" -> "Facture"
  // du menu de creation rapide mobile (BottomNav).
  useAutoOpenCreate(setShowForm);

  const mapped = useMemo(() => {
    if (!invoices) return [];
    return invoices.map((inv: any) => ({
      id: inv.id,
      clientId: inv.client_id,
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
      fne: {
        fne_status: inv.fne_status ?? null,
        fne_reference: inv.fne_reference ?? null,
        fne_ncc: inv.fne_ncc ?? null,
        fne_qr_token: inv.fne_qr_token ?? null,
        fne_certified_at: inv.fne_certified_at ?? null,
        fne_error: inv.fne_error ?? null,
      },
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

  function handleRemind(id: string) {
    if (remindingId) return;
    const inv = mapped.find((i) => i.id === id);
    if (!inv) return;
    if (!inv.clientEmail) {
      toast.error("Ce client n'a pas d'adresse email enregistree.");
      return;
    }
    setRemindingId(id);
    sendReminder.mutate(
      {
        invoiceId: id,
        clientId: inv.clientId,
        clientEmail: inv.clientEmail,
        invoiceNumber: inv.invoiceNumber,
        amountDue: inv.amountDue,
        dueDate: inv.dueDate,
      },
      {
        onSuccess: () => toast.success("Relance envoyee a " + inv.clientEmail),
        onError: (err: any) => toast.error(err.message),
        onSettled: () => setRemindingId(null),
      }
    );
  }

  function handleCancel(id: string, reason: string) {
    if (cancellingId) return;
    setCancellingId(id);
    cancelInvoice.mutate(
      { invoiceId: id, cancellationReason: reason },
      {
        onSuccess: () => toast.success("Facture annulee."),
        onError: (err: any) => toast.error(err.message),
        onSettled: () => setCancellingId(null),
      }
    );
  }

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
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                onMarkPaid={handleMarkPaid}
                onRemind={handleRemind}
                remindingId={remindingId}
                onCancel={handleCancel}
                cancelling={cancellingId === inv.id}
                showFne={isCotedivoire}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}