import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Bell, MoreVertical, Download, Loader2, Eye, Mail, Ban, X } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Avatar, StatusBadge, font } from "./Primitives";
import { generateInvoicePDF } from "../pdfGenerator";
import { useInvoicePdfContext } from "../useInvoicePdfContext";
import { useCancelInvoice, useSendInvoiceEmail } from "../useInvoices";
import ComplianceScoreBadge from "../../../components/ComplianceScoreBadge";

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

function MoreMenu({ invoice, anchorRect, onClose }: {
  invoice: InvoiceCardData; anchorRect: DOMRect; onClose: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cancelInvoice = useCancelInvoice();
  const sendEmail = useSendInvoiceEmail();
  const isCancelled = invoice.status === "annulee";
  const isPaid = invoice.status === "payee";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function handleCancel() {
    if (!confirm("Annuler la facture " + invoice.invoiceNumber + " ? Cette action est irreversible.")) return;
    cancelInvoice.mutate(invoice.id, {
      onSuccess: () => onClose(),
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  function handleSendEmail() {
    if (!invoice.clientEmail) {
      alert("Ce client n'a pas d'adresse email enregistree. Ajoutez-en une dans sa fiche avant d'envoyer.");
      return;
    }
    sendEmail.mutate({
      invoiceId: invoice.id,
      clientEmail: invoice.clientEmail,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      dueDate: invoice.dueDate,
    }, {
      onSuccess: (result: any) => {
        alert("Facture envoyee avec succes a " + invoice.clientEmail);
        onClose();
      },
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  const itemStyle: React.CSSProperties = {
    display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 14px",
    border:"none", background:"none", cursor:"pointer", fontFamily:font, fontSize:13,
    fontWeight:600, color:colors.gray[700], textAlign:"left",
  };

  // Position calculee a partir du bouton "..." ; s'ajuste si trop pres du bord droit/bas de l'ecran
  const menuWidth = 200;
  const spacing = 4;
  let left = anchorRect.right - menuWidth;
  left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
  let top = anchorRect.bottom + spacing;
  const estimatedMenuHeight = isCancelled || isPaid ? 88 : 132;
  if (top + estimatedMenuHeight > window.innerHeight - 8) {
    top = anchorRect.top - spacing - estimatedMenuHeight;
  }

  return createPortal(
    <>
      <div ref={menuRef} style={{ position:"fixed", top, left, zIndex:1000,
        background:colors.white, borderRadius:radius.md, border:"1px solid "+colors.gray[100],
        boxShadow:shadow.hover, minWidth:menuWidth, overflow:"hidden" }}>
        <button style={itemStyle} onClick={() => setShowDetail(true)}>
          <Eye size={15} color={colors.gray[500]} /> Voir la facture
        </button>
        <button style={{ ...itemStyle, opacity: sendEmail.isPending ? 0.6 : 1 }}
          disabled={sendEmail.isPending} onClick={handleSendEmail}>
          {sendEmail.isPending
            ? <Loader2 size={15} className="animate-spin" color={colors.gray[500]} />
            : <Mail size={15} color={colors.gray[500]} />}
          {sendEmail.isPending ? "Envoi en cours..." : "Envoyer par email"}
        </button>
        {!isCancelled && !isPaid && (
          <button style={{ ...itemStyle, color:palette.danger.solid, opacity: cancelInvoice.isPending ? 0.6 : 1 }}
            disabled={cancelInvoice.isPending} onClick={handleCancel}>
            {cancelInvoice.isPending
              ? <Loader2 size={15} className="animate-spin" color={palette.danger.solid} />
              : <Ban size={15} color={palette.danger.solid} />}
            Annuler la facture
          </button>
        )}
      </div>

      {showDetail && (
        <div onClick={() => setShowDetail(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
          zIndex:1001, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:colors.white, borderRadius:radius.lg,
            width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto", boxShadow:shadow.hover }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"16px 20px", borderBottom:"1px solid "+colors.gray[100] }}>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:colors.gray[900] }}>{invoice.invoiceNumber}</p>
              <button onClick={() => setShowDetail(false)} style={{ border:"none", background:"none", cursor:"pointer" }}>
                <X size={18} color={colors.gray[400]} />
              </button>
            </div>
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>Client</p>
                <p style={{ margin:"2px 0 0", fontSize:14, fontWeight:600, color:colors.gray[900] }}>{invoice.clientName}</p>
                {invoice.clientEmail && <p style={{ margin:0, fontSize:12.5, color:colors.gray[600] }}>{invoice.clientEmail}</p>}
              </div>
              <div style={{ display:"flex", gap:20 }}>
                <div>
                  <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>Statut</p>
                  <div style={{ marginTop:4 }}><StatusBadge status={invoice.status} /></div>
                </div>
                <div>
                  <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>Emise le</p>
                  <p style={{ margin:"4px 0 0", fontSize:13, color:colors.gray[900] }}>
                    {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>Echeance</p>
                    <p style={{ margin:"4px 0 0", fontSize:13, color:colors.gray[900] }}>
                      {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}
              </div>
              <div style={{ borderTop:"1px solid "+colors.gray[100], paddingTop:12 }}>
                {(invoice.items || []).map((it, idx) => (
                  <div key={idx} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0" }}>
                    <div>
                      <p style={{ margin:0, fontSize:13, color:colors.gray[900] }}>{it.description}</p>
                      <p style={{ margin:0, fontSize:11.5, color:colors.gray[400] }}>
                        {"x"+it.quantity+" x "+Number(it.unit_price).toLocaleString("fr-FR")+" FCFA"}
                      </p>
                    </div>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:colors.gray[900] }}>
                      {(it.quantity*it.unit_price).toLocaleString("fr-FR")+" FCFA"}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:"2px solid "+colors.gray[900], paddingTop:10, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:14, fontWeight:700, color:colors.gray[900] }}>Total</span>
                <span style={{ fontSize:14, fontWeight:700, color:palette.primary.solid }}>
                  {Math.round(invoice.total).toLocaleString("fr-FR")+" FCFA"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

export function InvoiceCard({ invoice, onMarkPaid, onRemind }: {
  invoice:InvoiceCardData; onMarkPaid:(id:string, amountDue:number)=>void; onRemind:(id:string)=>void;
}) {
  const [tx, setTx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const startX = useRef(0);
  const dragging = useRef(false);
  const clientColor = colorOf(invoice.clientName);
  const { data: pdfContext } = useInvoicePdfContext(invoice.templateId);

  function toggleMenu() {
    if (!menuOpen && menuBtnRef.current) {
      setAnchorRect(menuBtnRef.current.getBoundingClientRect());
    }
    setMenuOpen(v => !v);
  }

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

  const isPaid = invoice.status === "payee";

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
          <div style={{ display:"flex", gap:6 }}>
            {!isPaid && (
              <button onClick={()=>onMarkPaid(invoice.id, invoice.amountDue)} title="Marquer payee" style={{
                width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                background:colors.white, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <CheckCircle2 size={15} color={palette.green.solid}/>
              </button>
            )}
            <button onClick={()=>onRemind(invoice.id)} title="Relancer" style={{
              width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
              background:colors.white, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Bell size={15} color={palette.primary.solid}/>
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading} title="Telecharger PDF" style={{
              width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
              background:colors.white, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:downloading?"not-allowed":"pointer" }}>
              {downloading
                ? <Loader2 size={15} color={palette.primary.solid} className="animate-spin"/>
                : <Download size={15} color={palette.primary.solid}/>}
            </button>
            <div style={{ position:"relative" }}>
              <button ref={menuBtnRef} title="Plus" onClick={toggleMenu} style={{
                width:32, height:32, borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                background: menuOpen ? colors.gray[100] : colors.white,
                display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <MoreVertical size={15} color={colors.gray[400]}/>
              </button>
              {menuOpen && anchorRect && (
                <MoreMenu invoice={invoice} anchorRect={anchorRect} onClose={() => setMenuOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}