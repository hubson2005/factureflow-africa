import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2, Check, User, Package, FileText, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { useClients } from "../../clients/useClients";
import { useProducts } from "../../products/useProducts";
import { useInvoiceTemplates } from "../../invoiceTemplates/useInvoiceTemplates";
import { useCompany } from "../../../hooks/useCompany";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

type VatRateType = "normal" | "reduit" | "exonere" | "hors_champ";
type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  vatRateType: VatRateType;
  vatExemptionReason: string;
};

const VAT_OPTIONS: { value: VatRateType; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "reduit", label: "Réduit" },
  { value: "exonere", label: "Exonéré" },
  { value: "hors_champ", label: "Hors champ" },
];

function StepIndicator({ step }: { step:number }) {
  const steps = [
    { num:1, label:"Client", icon:User },
    { num:2, label:"Articles", icon:Package },
    { num:3, label:"Recapitulatif", icon:FileText },
  ];
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, marginBottom:24 }}>
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = step > s.num;
        const active = step === s.num;
        return (
          <React.Fragment key={s.num}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:36, height:36, borderRadius:radius.full,
                background: done ? palette.green.solid : active ? palette.primary.solid : colors.gray[100],
                color: done||active ? colors.white : colors.gray[400],
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {done ? <Check size={16}/> : <Icon size={16}/>}
              </div>
              <span style={{ fontSize:11, fontWeight:600,
                color: active ? palette.primary.solid : done ? palette.green.solid : colors.gray[400] }}>
                {s.label}
              </span>
            </div>
            {i < steps.length-1 && (
              <div style={{ width:48, height:2, background: step > s.num ? palette.green.solid : colors.gray[200],
                margin:"0 4px 18px" }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function NewInvoiceForm({ onClose, onSave, saving }: { onClose:()=>void; onSave:(data:any)=>void; saving?:boolean }) {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: products } = useProducts();
  const { data: templates } = useInvoiceTemplates();
  const { data: company } = useCompany();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id:"1", description:"", qty:1, unitPrice:0, vatRateType:"normal", vatExemptionReason:"" },
  ]);

  // Taux TVA "normal" reel de l'entreprise (companies.tax_rate), plutot que 18% fige.
  // Sert uniquement a l'apercu cote client : le calcul definitif se fait cote base
  // via get_current_vat_rate(pays, categorie) au moment de l'insertion des lignes.
  const companyVatRate = Number(company?.companies?.tax_rate) || 18;

  useEffect(() => {
    if (!templateId && templates && templates.length > 0) {
      const def = templates.find((t: any) => t.is_default) || templates[0];
      setTemplateId(def.id);
    }
  }, [templates, templateId]);

  const client = (clients||[]).find((c:any) => c.id === clientId);
  const filteredClients = (clients||[]).filter((c:any) => c.name.toLowerCase().includes(search.toLowerCase()));
  const step1Valid = clientId !== "";
  const step2Valid = items.some(i => i.description.trim() !== "" && i.unitPrice > 0)
    && items.every(i => i.vatRateType !== "exonere" || i.vatExemptionReason.trim() !== "");

  function vatRateFor(item: LineItem): number {
    if (item.vatRateType === "exonere" || item.vatRateType === "hors_champ") return 0;
    if (item.vatRateType === "reduit") return companyVatRate <= 9 ? companyVatRate : 9; // repli raisonnable si pas de taux reduit connu localement
    return companyVatRate;
  }

  const subtotal = items.reduce((s,i) => s+i.qty*i.unitPrice, 0);
  const tva = items.reduce((s,i) => s + (i.qty*i.unitPrice) * (vatRateFor(i)/100), 0);
  const total = subtotal + tva;

  function addItem() { setItems(prev => [...prev, { id:Date.now().toString(), description:"", qty:1, unitPrice:0, vatRateType:"normal", vatExemptionReason:"" }]); }
  function removeItem(id:string) { setItems(prev => prev.filter(i => i.id !== id)); }
  function updateItem(id:string, field:keyof LineItem, value:any) {
    setItems(prev => prev.map(i => i.id===id ? { ...i, [field]:value } : i));
  }
  function pickProduct(itemId:string, productId:string) {
    const p = (products||[]).find((p:any) => p.id===productId);
    if(!p) return;
    setItems(prev => prev.map(i => i.id===itemId ? { ...i, description:p.name, unitPrice:Number(p.unit_price) } : i));
  }
  function handleSubmit() {
    // vatRateType/vatExemptionReason transmis pour chaque ligne ; le taux numerique
    // (tax_rate) n'est volontairement pas fixe ici — laisse au moteur cote base
    // (auto_fill_vat_rate) le soin de le determiner a partir du pays de l'entreprise.
    onSave({ clientId, dueDate, notes, items, templateId: templateId || null });
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:colors.gray[50], borderRadius:radius.lg, width:"100%", maxWidth:560,
        maxHeight:"90vh", overflowY:"auto", boxShadow:shadow.hover }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", background:colors.white, borderBottom:"1px solid "+colors.gray[100],
          position:"sticky", top:0, zIndex:10 }}>
          <button onClick={onClose} style={{ display:"flex", alignItems:"center", gap:6, border:"none",
            background:"none", cursor:"pointer", fontSize:13, fontWeight:600, color:colors.gray[600], fontFamily:font }}>
            <ArrowLeft size={15}/> Annuler
          </button>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:colors.gray[900] }}>Nouvelle facture</p>
          <div style={{ width:80 }}/>
        </div>

        <div style={{ padding:20 }}>
          <StepIndicator step={step}/>

          {step===1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {templates && templates.length > 1 && (
                <div>
                  <label style={{ fontSize:12.5, fontWeight:600, color:colors.gray[600] }}>Modele de facture</label>
                  <select value={templateId} onChange={(e)=>setTemplateId(e.target.value)}
                    style={{ marginTop:6, padding:"11px 14px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                      fontSize:14, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white,
                      width:"100%", boxSizing:"border-box" }}>
                    {templates.map((t:any) => (
                      <option key={t.id} value={t.id}>{t.name}{t.is_default ? " (par defaut)" : ""}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:colors.gray[600] }}>Client</label>
                <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Rechercher un client..."
                  style={{ marginTop:6, padding:"11px 14px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                    fontSize:14, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white, width:"100%", boxSizing:"border-box" }}/>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
                  {clientsLoading ? (
                    <p style={{ fontSize:13, color:colors.gray[600] }}>Chargement...</p>
                  ) : filteredClients.length===0 ? (
                    <p style={{ fontSize:13, color:colors.gray[600] }}>Aucun client. Ajoutez-en un dans le module Clients.</p>
                  ) : filteredClients.map((c:any) => (
                    <button key={c.id} onClick={()=>setClientId(c.id)} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px",
                      borderRadius:radius.md, border:"1px solid "+(clientId===c.id ? palette.primary.solid : colors.gray[200]),
                      background: clientId===c.id ? palette.primary[50] : colors.white, cursor:"pointer", fontFamily:font,
                    }}>
                      <div style={{ textAlign:"left" }}>
                        <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:colors.gray[900] }}>{c.name}</p>
                        <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>{c.email || c.phone || "-"}</p>
                      </div>
                      {clientId===c.id && <Check size={16} color={palette.primary.solid}/>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:colors.gray[600] }}>Date d'echeance</label>
                <input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)}
                  style={{ marginTop:6, padding:"11px 14px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                    fontSize:14, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white, width:"100%", boxSizing:"border-box" }}/>
              </div>
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:colors.gray[600] }}>Notes (optionnel)</label>
                <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3}
                  placeholder="Conditions de paiement, remarques..."
                  style={{ marginTop:6, padding:"11px 14px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                    fontSize:14, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white,
                    resize:"vertical", width:"100%", boxSizing:"border-box" }}/>
              </div>
            </div>
          )}

          {step===2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {items.map((item, idx) => (
                <div key={item.id} style={{ background:colors.gray[50], borderRadius:radius.lg, padding:14,
                  border:"1px solid "+colors.gray[200], display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:colors.gray[600] }}>{"Article "+(idx+1)}</span>
                    <button onClick={()=>removeItem(item.id)} style={{ border:"none", background:"none", cursor:"pointer" }}>
                      <Trash2 size={15} color={palette.danger.solid}/>
                    </button>
                  </div>
                  {products && products.length>0 && (
                    <select onChange={(e)=>pickProduct(item.id, e.target.value)} defaultValue=""
                      style={{ padding:"9px 12px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                        fontSize:13, fontFamily:font, color:colors.gray[600], background:colors.white }}>
                      <option value="" disabled>Choisir un produit/service...</option>
                      {products.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <input value={item.description} onChange={(e)=>updateItem(item.id,"description",e.target.value)}
                    placeholder="Description..."
                    style={{ padding:"9px 12px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                      fontSize:13, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white }}/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:colors.gray[600] }}>Qte</label>
                      <input type="number" value={item.qty} min={1}
                        onChange={(e)=>updateItem(item.id,"qty",parseFloat(e.target.value)||1)}
                        style={{ width:"100%", padding:"9px 10px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                          fontSize:13, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white, boxSizing:"border-box" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:colors.gray[600] }}>Prix unit.</label>
                      <input type="number" value={item.unitPrice} min={0}
                        onChange={(e)=>updateItem(item.id,"unitPrice",parseFloat(e.target.value)||0)}
                        style={{ width:"100%", padding:"9px 10px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                          fontSize:13, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white, boxSizing:"border-box" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:colors.gray[600] }}>Total HT</label>
                      <div style={{ padding:"9px 10px", borderRadius:radius.md, border:"1px solid "+colors.gray[100],
                        background:colors.gray[50], fontSize:13, fontWeight:700, color:colors.gray[900] }}>
                        {(item.qty * item.unitPrice).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:colors.gray[600] }}>Categorie TVA</label>
                    <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                      {VAT_OPTIONS.map(opt => {
                        const active = item.vatRateType === opt.value;
                        return (
                          <button key={opt.value} onClick={()=>updateItem(item.id,"vatRateType",opt.value)} style={{
                            padding:"5px 11px", borderRadius:radius.full, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:font,
                            border:"1px solid "+(active ? palette.primary.solid : colors.gray[200]),
                            background: active ? palette.primary[50] : colors.white,
                            color: active ? palette.primary.text : colors.gray[500] }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {item.vatRateType === "exonere" && (
                      <input value={item.vatExemptionReason} onChange={(e)=>updateItem(item.id,"vatExemptionReason",e.target.value)}
                        placeholder="Motif de l'exoneration (obligatoire)"
                        style={{ marginTop:8, width:"100%", padding:"9px 12px", borderRadius:radius.md,
                          border:"1px solid "+(item.vatExemptionReason.trim()===""? palette.danger.solid : colors.gray[200]),
                          fontSize:13, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white, boxSizing:"border-box" }}/>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addItem} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                padding:"12px", borderRadius:radius.md, border:"2px dashed "+colors.gray[200],
                background:"transparent", fontSize:13, fontWeight:600, color:colors.gray[600],
                cursor:"pointer", fontFamily:font }}>
                <Plus size={15}/> Ajouter un article
              </button>
            </div>
          )}

          {step===3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:colors.white, borderRadius:radius.lg, padding:16, border:"1px solid "+colors.gray[100] }}>
                <p style={{ margin:0, fontSize:13, color:colors.gray[600] }}>
                  {"Client : "}<strong style={{ color:colors.gray[900] }}>{client?.name ?? "-"}</strong>
                </p>
                {dueDate && <p style={{ margin:"4px 0 0", fontSize:13, color:colors.gray[600] }}>{"Echeance : "+dueDate}</p>}
                {templates && templates.length > 1 && (
                  <p style={{ margin:"4px 0 0", fontSize:13, color:colors.gray[600] }}>
                    {"Modele : "}<strong style={{ color:colors.gray[900] }}>
                      {templates.find((t:any)=>t.id===templateId)?.name ?? "-"}
                    </strong>
                  </p>
                )}
              </div>
              <div style={{ background:colors.white, borderRadius:radius.lg, padding:16, border:"1px solid "+colors.gray[100] }}>
                {items.filter(i=>i.description).map(item => (
                  <div key={item.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0",
                    borderBottom:"1px solid "+colors.gray[100] }}>
                    <div>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:colors.gray[900] }}>{item.description}</p>
                      <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>
                        {"x"+item.qty+" x "+item.unitPrice.toLocaleString("fr-FR")+" FCFA"}
                        {item.vatRateType !== "normal" ? " · TVA "+VAT_OPTIONS.find(o=>o.value===item.vatRateType)?.label : ""}
                      </p>
                    </div>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:colors.gray[900] }}>
                      {(item.qty*item.unitPrice).toLocaleString("fr-FR")+" FCFA"}
                    </p>
                  </div>
                ))}
                <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, color:colors.gray[600] }}>Sous-total</span>
                    <span style={{ fontSize:13, color:colors.gray[900] }}>{subtotal.toLocaleString("fr-FR")+" FCFA"}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, color:colors.gray[600] }}>TVA</span>
                    <span style={{ fontSize:13, color:colors.gray[900] }}>{Math.round(tva).toLocaleString("fr-FR")+" FCFA"}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0",
                    borderTop:"2px solid "+colors.gray[900], marginTop:4 }}>
                    <span style={{ fontSize:15, fontWeight:700, color:colors.gray[900] }}>Total</span>
                    <span style={{ fontSize:15, fontWeight:700, color:palette.primary.solid }}>
                      {Math.round(total).toLocaleString("fr-FR")+" FCFA"}
                    </span>
                  </div>
                  <p style={{ margin:"6px 0 0", fontSize:11, color:colors.gray[400] }}>
                    Montant TVA indicatif — le taux exact appliqué à l'enregistrement dépend de la
                    configuration fiscale du pays de votre entreprise.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10, padding:"16px 20px", background:colors.white,
          borderTop:"1px solid "+colors.gray[100], position:"sticky", bottom:0 }}>
          {step > 1 && (
            <button onClick={()=>setStep(s=>s-1)} style={{ display:"flex", alignItems:"center", gap:6,
              padding:"11px 16px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
              background:colors.white, fontSize:13, fontWeight:600, color:colors.gray[700],
              cursor:"pointer", fontFamily:font }}>
              <ArrowLeft size={14}/> Retour
            </button>
          )}
          {step < 3 && (
            <button onClick={()=>setStep(s=>s+1)}
              disabled={step===1?!step1Valid:!step2Valid}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"11px 16px", borderRadius:radius.md, border:"none",
                background: (step===1?step1Valid:step2Valid) ? palette.primary.solid : colors.gray[200],
                color: (step===1?step1Valid:step2Valid) ? colors.white : colors.gray[400],
                fontSize:13, fontWeight:700, cursor:(step===1?step1Valid:step2Valid)?"pointer":"not-allowed", fontFamily:font }}>
              Continuer <ArrowRight size={14}/>
            </button>
          )}
          {step===3 && (
            <button onClick={handleSubmit} disabled={saving} style={{ flex:1, display:"flex",
              alignItems:"center", justifyContent:"center", gap:6, padding:"11px 16px",
              borderRadius:radius.md, border:"none", background:palette.primary.solid,
              color:colors.white, fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:font }}>
              {saving ? <><Loader2 size={14} className="animate-spin"/> Creation...</> : <><Check size={14}/> Creer la facture</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}