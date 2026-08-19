import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, User, MapPin, Phone, Mail, Building2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:12.5, fontWeight:600, color:colors.gray[600] }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type="text", placeholder="", icon:Icon }: {
  value:string; onChange:(v:string)=>void; type?:string; placeholder?:string; icon?:any;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px",
      borderRadius:radius.md, border:"1px solid "+colors.gray[200], background:colors.white }}>
      {Icon && <Icon size={15} color={colors.gray[400]}/>}
      <input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
        style={{ flex:1, border:"none", outline:"none", fontSize:14, fontFamily:font,
          color:colors.gray[900], background:"transparent", width:"100%" }}/>
    </div>
  );
}

function StepDot({ active, done }: { active:boolean; done:boolean }) {
  return (
    <div style={{ width:32, height:32, borderRadius:radius.full,
      background: done?palette.green.solid:active?palette.primary.solid:colors.gray[100],
      color: done||active?colors.white:colors.gray[400],
      display:"flex", alignItems:"center", justifyContent:"center", transition:"all 200ms" }}>
      {done ? <Check size={14}/> : active ? <User size={14}/> : <Building2 size={14}/>}
    </div>
  );
}

// Client existant a pre-remplir : presence de ce prop = mode edition
export interface EditableClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  address?: string | null;
  notes?: string | null;
}

export function NewClientForm({ onClose, onSave, client }: {
  onClose:()=>void; onSave:(data:any)=>void; client?: EditableClient;
}) {
  const isEdit = !!client;
  const [step, setStep] = useState(1);

  // Etape 1 : Infos personnelles
  const [name, setName] = useState(client?.name || "");
  const [email, setEmail] = useState(client?.email || "");
  const [phone, setPhone] = useState(client?.phone || "");

  // Etape 2 : Infos entreprise
  // Note : "city" n'a pas de colonne dediee dans la table clients (seulement "address"),
  // conserve tel quel pour ne pas changer le comportement existant.
  const [company, setCompany] = useState(client?.company_name || "");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState(client?.address || "");
  const [notes, setNotes] = useState(client?.notes || "");

  const step1Valid = name.trim() !== "" && email.includes("@");

  function handleSave() {
    onSave({ name, email, phone, company, city, address, notes });
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:colors.gray[50], borderRadius:radius.lg, width:"100%", maxWidth:500,
        maxHeight:"90vh", overflowY:"auto", boxShadow:shadow.hover }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", background:colors.white, borderBottom:"1px solid "+colors.gray[100],
          position:"sticky", top:0, zIndex:10 }}>
          <button onClick={onClose} style={{ display:"flex", alignItems:"center", gap:6,
            border:"none", background:"none", cursor:"pointer", fontSize:13, fontWeight:600,
            color:colors.gray[600], fontFamily:font }}>
            <ArrowLeft size={15}/> Annuler
          </button>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:colors.gray[900] }}>
            {isEdit ? "Modifier le client" : "Nouveau client"}
          </p>
          <div style={{ width:80 }}/>
        </div>

        {/* Stepper */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, padding:"20px 20px 0" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <StepDot active={step===1} done={step>1}/>
            <span style={{ fontSize:11, fontWeight:600, color:step===1?palette.primary.solid:step>1?palette.green.solid:colors.gray[400] }}>
              Contact
            </span>
          </div>
          <div style={{ width:48, height:2, background:step>1?palette.green.solid:colors.gray[200], margin:"0 4px 18px" }}/>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:32, height:32, borderRadius:radius.full,
              background: step===2?palette.primary.solid:colors.gray[100],
              color: step===2?colors.white:colors.gray[400],
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Building2 size={14}/>
            </div>
            <span style={{ fontSize:11, fontWeight:600, color:step===2?palette.primary.solid:colors.gray[400] }}>
              Entreprise
            </span>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14 }}>
          {step === 1 && (
            <>
              <Field label="Nom complet *">
                <Input value={name} onChange={setName} placeholder="Kouame Jean" icon={User}/>
              </Field>
              <Field label="Email *">
                <Input value={email} onChange={setEmail} type="email" placeholder="contact@email.ci" icon={Mail}/>
              </Field>
              <Field label="Telephone">
                <Input value={phone} onChange={setPhone} type="tel" placeholder="+225 07 00 00 00 00" icon={Phone}/>
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="Nom de l'entreprise">
                <Input value={company} onChange={setCompany} placeholder="Mon Entreprise SARL" icon={Building2}/>
              </Field>
              <Field label="Ville">
                <Input value={city} onChange={setCity} placeholder="Abidjan" icon={MapPin}/>
              </Field>
              <Field label="Adresse complete">
                <Input value={address} onChange={setAddress} placeholder="Cocody, Rue des Jardins" icon={MapPin}/>
              </Field>
              <Field label="Notes (optionnel)">
                <textarea value={notes} onChange={(e)=>setNotes(e.target.value)}
                  placeholder="Informations complementaires..."
                  rows={3} style={{ padding:"11px 14px", borderRadius:radius.md,
                    border:"1px solid "+colors.gray[200], fontSize:14, fontFamily:font,
                    color:colors.gray[900], outline:"none", background:colors.white,
                    resize:"vertical", width:"100%", boxSizing:"border-box" }}/>
              </Field>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", gap:10, padding:"16px 20px",
          background:colors.white, borderTop:"1px solid "+colors.gray[100],
          position:"sticky", bottom:0 }}>
          {step > 1 && (
            <button onClick={()=>setStep(1)} style={{ display:"flex", alignItems:"center", gap:6,
              padding:"11px 16px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
              background:colors.white, fontSize:13, fontWeight:600, color:colors.gray[700],
              cursor:"pointer", fontFamily:font }}>
              <ArrowLeft size={14}/> Retour
            </button>
          )}
          {step === 1 && (
            <button onClick={()=>setStep(2)} disabled={!step1Valid} style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"11px 16px", borderRadius:radius.md, border:"none",
              background: step1Valid?palette.primary.solid:colors.gray[200],
              color: step1Valid?colors.white:colors.gray[400],
              fontSize:13, fontWeight:700, cursor:step1Valid?"pointer":"not-allowed", fontFamily:font }}>
              Continuer <ArrowRight size={14}/>
            </button>
          )}
          {step === 2 && (
            <button onClick={handleSave} style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"11px 16px", borderRadius:radius.md, border:"none",
              background:palette.primary.solid, color:colors.white,
              fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:font }}>
              <Check size={14}/> {isEdit ? "Enregistrer les modifications" : "Enregistrer le client"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}