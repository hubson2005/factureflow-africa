import React, { useRef, useState } from "react";
import { CheckCircle2, Bell, MoreVertical, Download, Loader2, Ban, ShieldCheck } from "lucide-react";
import { palette, colors, radius, shadow } from "../../../theme/tokens";
import { Avatar, StatusBadge, font } from "./Primitives";
import { generateInvoicePDF } from "../pdfGenerator";
import { useInvoicePdfContext } from "../useInvoicePdfContext";
import { useCertifyInvoiceFne } from "../useInvoices";
import ComplianceScoreBadge from "../../../components/ComplianceScoreBadge";
import { InvoiceFneVisual } from "./InvoiceFneVisual";
import { CancelInvoiceModal } from "./CancelInvoiceModal";

export interface InvoiceCardData {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  total: number;
  amountDue: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  templateId?: string | null;
  items: { description:string; quantity:number; unit_price:number }[];
  complianceStatus?: {
    score: number;
    status: string;
    missing_fields: string[];
    country_code: string | null;
    e_invoicing_system: string | null;
    e_invoicing_status: string | null;
    computed_at: string;
  } | null;
  // Certification FNE (Cote d'Ivoire) — objet imbrique tel que fourni par Invoices.tsx,
  // voir InvoiceFneVisual.tsx pour la forme exacte (fne_status/fne_reference/...)
  fne?: {
    fne_status?: string | null;
    fne_reference?: string | null;
    fne_ncc?: string | null;
    fne_qr_token?: string | null;
    fne_certified_at?: string | null;
    fne_error?: string | null;
  } | null;
}

function initialsOf(name:string) {
  return (name || "?").substring(0,2).toUpperCase();
}
function colorOf(name:string) {
  const colorsList = ["primary","blue","green","purple","yellow","danger"] as const;
  let hash = 0;
  for (let i=0;i<name.length;i++) hash = name.charCodeAt(i) + ((hash<<5)-hash);
  return colorsList[Math.abs(hash) % colorsList.length];
}

export function InvoiceCard({ invoice, onMarkPaid, onRemind, onCancel, cancelling, remindingId, showFne }: {
  invoice:InvoiceCardData; onMarkPaid:(id:string, amountDue:number)=>void; onRemind:(id:string)=>void;
  onCancel:(id:string, reason:string)=>void; cancelling?:boolean; remindingId?:string|null; showFne?:boolean;
}) {
  const [tx, setTx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const clientColor = colorOf(invoice.clientName);
  const { data: pdfContext } = useInvoicePdfContext(invoice.templateId);
  const certifyFne = useCertifyInvoiceFne();

  function onTouchStart(e: React.TouchEvent) { startX.current=e.touches[0].clientX; dragging.current=true; }
  function onTouchMove(e: React.TouchEvent) {
    if(!dragging.current) return;
    setTx(Math.max(-132, Math.min(0, e.touches[0].clientX-startX.current)));
  }
  function onTouchEnd() { dragging.current=false; setTx(p=>p<-66?-132:0); }

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      await generateInvoicePDF({
        code: invoice.invoiceNumber,
        issueDate: new Date(invoice.createdAt).toLocaleDateString("fr-FR"),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("fr-FR") : undefined,
        status: invoice.status,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientPhone: invoice.clientPhone,
        companyName: pdfContext?.company?.name,
        companyPhone: pdfContext?.company?.phone,
        companyEmail: pdfContext?.company?.email,
        companyAddress: pdfContext?.company?.address,
        items: (invoice.items ?? []).map(i => ({ description:i.description, qty:i.quantity, unitPrice:i.unit_price })),
        template: pdfContext?.template || undefined,
      });
    } finally {
      setDownloading(false);
    }
  }

  function handleConfirmCancel(reason: string) {
    onCancel(invoice.id, reason);
  }

  function handleCertifyFne() {
    setMenuOpen(false);
    certifyFne.mutate(invoice.id, {
      onSuccess: (result: any) => {
        alert(result?.simulated
          ? "Certification simulée (aucune clé API FNE configurée — voir Paramètres > Conformité fiscale)."
          : "Facture certifiée avec succès auprès de la FNE.");
      },
      onError: (err: any) => alert("Erreur de certification : " + err.message),
    });
  }

  const isPaid = invoice.status === "payee";
  const isCancelled = invoice.status === "annulee";
  const isReminding = remindingId === invoice.id;

  return (
    <div style={{ position:"relative", overflow:"hidden", borderRadius:radius.lg, marginBottom:12 }}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, display:"flex", zIndex:0 }}>
        {!isPaid && (
          <button onClick={()=>{setTx(0);onMarkPaid(invoice.id, invoice.amountDue);}} style={{
            width:66, border:"none", background:palette.green.solid, color:colors.white,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:4, cursor:"pointer", fontFamily:font }}>
            <CheckCircle2 size={18}/><span style={{ fontSize:10, fontWeight:600 }}>Payee</span>
          </button>
        )}
        <button onClick={()=>{setTx(0);onRemind(invoice.id);}} style={{
          width:66, border:"none", background:palette.primary.solid, color:colors.white,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:4, cursor:"pointer", fontFamily:font }}>
          <Bell size={18}/><span style={{ fontSize:10, fontWeight:600 }}>Relancer</span>
        </button>
      </div>

      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ position:"relative", zIndex:1, background:colors.white, borderRadius:radius.lg,
          padding:16, border:"1px solid "+colors.gray[100], boxShadow:shadow.card,
          transform:"translateX("+tx+"px)", transition:dragging.current?"none":"transform 200ms ease",
          display:"flex", flexDirection:"column", gap:10 }}>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Avatar initials={initialsOf(invoice.clientName)} color={clientColor} size={38}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:colors.gray[900],
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{invoice.clientName}</p>
            <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>{invoice.invoiceNumber}</p>
          </div>
          <StatusBadge status={invoice.status}/>
        </div>

        {invoice.complianceStatus && (
          <div style={{ display:"flex" }}>
            <ComplianceScoreBadge complianceStatus={invoice.complianceStatus}/>
          </div>
        )}

        {showFne && invoice.fne?.fne_status && invoice.fne.fne_status !== "non_certifiee" && (
          <InvoiceFneVisual fne={invoice.fne} />
        )}

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:8 }}>
          <div>
            <p style={{ margin:0, fontSize:20, fontWeight:700, color:colors.gray[900] }}>
              {Math.round(invoice.total).toLocaleString("fr-FR")} <span style={{ fontSize:12, fontWeight:500, color:colors.gray[600] }}>FCFA</span>
            </p>
            <p style={{ margin:"2px 0 0", fontSize:11.5, color:colors.gray[400] }}>
              {"Emise le "+new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
              {invoice.dueDate ? " · Echeance "+new Date(invoice.dueDate).toLocaleDateString("fr-FR") : ""}
              {invoice.amountDue > 0 && invoice.amountDue < invoice.total ? " · Reste "+Math.round(invoice.amountDue).toLocaleString("fr-FR")+" FCFA" : ""}
            </p>
          </div>
          <div style={{ display:"flex", gap:6, position:"relative" }}>
            {!isPaid && (
              <button onClick={()=>onMarkPaid(invoice.id, invoice.amountDue)} title="Marquer payee" style={{
                width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                background:colors.white, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <CheckCircle2 size={15} color={palette.green.solid}/>
              </button>
            )}
            <button onClick={()=>onRemind(invoice.id)} disabled={isReminding} title="Relancer" style={{
              width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
              background:colors.white, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:isReminding?"not-allowed":"pointer" }}>
              {isReminding
                ? <Loader2 size={15} color={palette.primary.solid} className="animate-spin"/>
                : <Bell size={15} color={palette.primary.solid}/>}
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading} title="Telecharger PDF" style={{
              width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
              background:colors.white, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:downloading?"not-allowed":"pointer" }}>
              {downloading
                ? <Loader2 size={15} color={palette.primary.solid} className="animate-spin"/>
                : <Download size={15} color={palette.primary.solid}/>}
            </button>
            <button title="Plus" onClick={()=>setMenuOpen(o=>!o)} style={{
              width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
              background:colors.white, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <MoreVertical size={15} color={colors.gray[400]}/>
            </button>

            {menuOpen && (
              <>
                <div onClick={()=>setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:9 }}/>
                <div style={{
                  position:"absolute", top:36, right:0, zIndex:10, minWidth:170,
                  background:colors.white, borderRadius:radius.md, boxShadow:shadow.card,
                  border:"1px solid "+colors.gray[100], padding:4 }}>
                  {showFne && (!invoice.fne?.fne_status || invoice.fne.fne_status === "non_certifiee" || invoice.fne.fne_status === "erreur") && (
                    <button
                      disabled={certifyFne.isPending}
                      onClick={handleCertifyFne}
                      style={{
                        width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                        border:"none", background:"transparent", borderRadius:radius.sm,
                        fontSize:12.5, fontWeight:600, fontFamily:font,
                        color:certifyFne.isPending?colors.gray[300]:palette.primary.solid,
                        cursor:certifyFne.isPending?"not-allowed":"pointer", textAlign:"left" }}>
                      {certifyFne.isPending
                        ? <Loader2 size={14} className="animate-spin"/>
                        : <ShieldCheck size={14}/>}
                      {certifyFne.isPending ? "Certification..." : "Certifier via FNE"}
                    </button>
                  )}
                  <button
                    disabled={isCancelled}
                    onClick={()=>{ setMenuOpen(false); setShowCancelModal(true); }}
                    style={{
                      width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                      border:"none", background:"transparent", borderRadius:radius.sm,
                      fontSize:12.5, fontWeight:600, fontFamily:font,
                      color:isCancelled?colors.gray[300]:palette.danger.solid,
                      cursor:isCancelled?"not-allowed":"pointer", textAlign:"left" }}>
                    <Ban size={14}/> {isCancelled ? "Deja annulee" : "Annuler la facture"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelInvoiceModal
          invoiceNumber={invoice.invoiceNumber}
          saving={!!cancelling}
          onClose={()=>setShowCancelModal(false)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}

