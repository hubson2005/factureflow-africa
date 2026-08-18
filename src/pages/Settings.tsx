import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CreditCard, Users, Bell, Shield, ChevronRight, Save, Check, PenTool, CreditCard as CardIcon, Loader2, Palette, ShieldCheck, Eye, EyeOff, Webhook } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useCompany } from "../hooks/useCompany";
import { useUpdateCompanySignature } from "../hooks/useUpdateCompanySignature";
import { SignaturePad } from "../components/shared/SignaturePad";
import { PLANS, useSubscription, useChangePlan } from "../modules/subscription/useSubscription";
import { useCountryConfigs, useUpdateCompanyCompliance, useUpdateFneSettings } from "../modules/settings/useCompanySettings";
import IntegrationsSection from "../modules/settings/IntegrationsSection";


const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";


const TABS = [
  { id:"entreprise", label:"Entreprise", icon:Building2 },
  { id:"conformite", label:"Conformite fiscale", icon:ShieldCheck },
  { id:"integrations", label:"Integrations", icon:Webhook },
  { id:"facturation", label:"Facturation", icon:CreditCard },
  { id:"modeles", label:"Modeles de facture", icon:Palette, path:"/invoice-templates" },
  { id:"equipe", label:"Equipe", icon:Users, path:"/team" },
  { id:"notifications", label:"Notifications", icon:Bell },
  { id:"securite", label:"Securite", icon:Shield },
  { id:"signature", label:"Signature", icon:PenTool },
  { id:"abonnement", label:"Abonnement", icon:CardIcon },
];


function Field({ label, value, onChange, type="text", placeholder="" }: {
  label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:12.5, fontWeight:600, color:colors.gray[600] }}>{label}</label>
      <input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
        style={{ padding:"11px 14px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
          fontSize:14, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white,
          width:"100%", boxSizing:"border-box" }} />
    </div>
  );
}


function Section({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ background:colors.white, borderRadius:radius.lg, padding:24,
      border:"1px solid "+colors.gray[100], boxShadow:shadow.card, display:"flex", flexDirection:"column", gap:18 }}>
      <p style={{ margin:0, fontSize:14, fontWeight:700, color:colors.gray[900] }}>{title}</p>
      {children}
    </div>
  );
}


function Toggle({ label, description, value, onChange }: {
  label:string; description:string; value:boolean; onChange:(v:boolean)=>void;
}) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
      <div>
        <p style={{ margin:0, fontSize:13.5, fontWeight:600, color:colors.gray[900] }}>{label}</p>
        <p style={{ margin:"2px 0 0", fontSize:12, color:colors.gray[600] }}>{description}</p>
      </div>
      <button onClick={()=>onChange(!value)} style={{
        width:44, height:24, borderRadius:radius.full, border:"none", cursor:"pointer",
        background: value ? palette.primary.solid : colors.gray[200],
        position:"relative", transition:"background 200ms ease", flexShrink:0,
      }}>
        <div style={{ width:18, height:18, borderRadius:"50%", background:colors.white,
          position:"absolute", top:3, left: value?23:3, transition:"left 200ms ease" }}/>
      </button>
    </div>
  );
}


const STATUS_LABELS: Record<string,{label:string; color:string; bg:string}> = {
  active: { label:"Actif", color: palette.green.solid, bg: palette.green[50] },
  trial: { label:"Essai", color: palette.blue.solid, bg: palette.blue[50] },
  suspended: { label:"Suspendu", color: palette.danger.solid, bg: palette.danger[50] },
};


function SubscriptionSection() {
  const { data: sub, isLoading } = useSubscription();
  const changePlan = useChangePlan();
  const [confirmingPlan, setConfirmingPlan] = useState<string|null>(null);


  if (isLoading || !sub) {
    return (
      <Section title="Abonnement">
        <div style={{ display:"flex", justifyContent:"center", padding:30 }}>
          <Loader2 size={18} className="animate-spin" color={palette.primary.solid}/>
        </div>
      </Section>
    );
  }


  const trialExpired = sub.subscription_status === "trial" && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date();
  const statusInfo = STATUS_LABELS[sub.subscription_status] || STATUS_LABELS.active;


  function handleChoose(planId: string, price: number) {
    if (planId === sub?.subscription_plan) return;
    if (confirmingPlan !== planId) { setConfirmingPlan(planId); return; }
    changePlan.mutate({ newPlan: planId, amount: price }, {
      onSuccess: () => setConfirmingPlan(null),
      onError: (err:any) => alert("Erreur : " + err.message),
    });
  }


  return (
    <>
      <Section title="Votre abonnement actuel">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <p style={{ margin:0, fontSize:12.5, color:colors.gray[600] }}>Plan actuel</p>
            <p style={{ margin:"4px 0 0", fontSize:20, fontWeight:700, color:colors.gray[900], textTransform:"capitalize" }}>
              {PLANS.find(p => p.id === sub.subscription_plan)?.name || sub.subscription_plan}
            </p>
          </div>
          <span style={{ fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:radius.full,
            background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>
        {trialExpired && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:palette.danger[50],
            border:"1px solid "+palette.danger.solid+"33", borderRadius:radius.md, padding:"10px 14px" }}>
            <Shield size={15} color={palette.danger.solid}/>
            <span style={{ fontSize:13, color:palette.danger.solid, fontWeight:600 }}>
              Votre periode d'essai a expire. Choisissez un plan pour continuer.
            </span>
          </div>
        )}
      </Section>


      <Section title="Changer de plan">
        <p style={{ margin:"-8px 0 4px", fontSize:12.5, color:colors.gray[600] }}>
          Le changement de plan est applique immediatement (pas de facturation reelle configuree pour le moment).
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === sub.subscription_plan;
            const isConfirming = confirmingPlan === plan.id;
            return (
              <div key={plan.id} style={{
                border: isCurrent ? "2px solid "+palette.primary.solid : "1px solid "+colors.gray[200],
                borderRadius:radius.lg, padding:18, display:"flex", flexDirection:"column", gap:12,
                background: isCurrent ? palette.primary[50] : colors.white,
              }}>
                <div>
                  <p style={{ margin:0, fontSize:15, fontWeight:700, color:colors.gray[900] }}>{plan.name}</p>
                  <p style={{ margin:"4px 0 0", fontSize:20, fontWeight:700, color:colors.gray[900] }}>
                    {plan.price === 0 ? "Gratuit" : plan.price.toLocaleString("fr-FR")+" FCFA"}
                    {plan.price > 0 && <span style={{ fontSize:12, fontWeight:500, color:colors.gray[600] }}>{"/mois"}</span>}
                  </p>
                </div>
                <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display:"flex", alignItems:"flex-start", gap:6, fontSize:12.5, color:colors.gray[700] }}>
                      <Check size={13} color={palette.primary.solid} style={{ flexShrink:0, marginTop:2 }}/>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChoose(plan.id, plan.price)}
                  disabled={isCurrent || changePlan.isPending}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    padding:"10px 14px", borderRadius:radius.md, border:"none",
                    background: isCurrent ? colors.gray[200] : (isConfirming ? palette.danger.solid : palette.primary.solid),
                    color: isCurrent ? colors.gray[400] : colors.white,
                    fontSize:13, fontWeight:700,
                    cursor: isCurrent ? "not-allowed" : "pointer", fontFamily:font,
                  }}>
                  {changePlan.isPending && confirmingPlan === plan.id
                    ? <Loader2 size={14} className="animate-spin"/>
                    : isCurrent ? "Plan actuel" : isConfirming ? "Confirmer ?" : "Choisir ce plan"}
                </button>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}


const COUNTRY_FALLBACK = [
  { country_code: "CI", country_name: "Côte d'Ivoire", fiscal_number_label: "NCC", requires_rccm: true, e_invoicing_system: "FNE", e_invoicing_status: "obligatoire" },
  { country_code: "SN", country_name: "Sénégal", fiscal_number_label: "NINEA", requires_rccm: true, e_invoicing_system: null, e_invoicing_status: "non_requis" },
  { country_code: "BJ", country_name: "Bénin", fiscal_number_label: "IFU", requires_rccm: true, e_invoicing_system: "e-MECeF", e_invoicing_status: "en_deploiement" },
  { country_code: "BF", country_name: "Burkina Faso", fiscal_number_label: "IFU", requires_rccm: true, e_invoicing_system: "Facture électronique certifiée", e_invoicing_status: "en_deploiement" },
];

const TAX_REGIMES = [
  { value: "reel_normal", label: "Réel normal" },
  { value: "reel_simplifie", label: "Réel simplifié" },
  { value: "forfaitaire", label: "Forfaitaire" },
  { value: "entreprenant", label: "Entreprenant" },
];

function ComplianceSection({ company }: any) {
  const { data: countryConfigs } = useCountryConfigs();
  const updateCompliance = useUpdateCompanyCompliance();
  const updateFne = useUpdateFneSettings();

  const companies = company?.companies || {};
  const [countryCode, setCountryCode] = useState(companies.country_code || "");
  const [taxRegime, setTaxRegime] = useState(companies.tax_regime || "");
  const [fiscalNumber, setFiscalNumber] = useState(companies.fiscal_number || "");
  const [rccmNumber, setRccmNumber] = useState(companies.rccm_number || "");
  const [capitalSocial, setCapitalSocial] = useState(companies.capital_social ?? "");

  const [fneMode, setFneMode] = useState(companies.fne_mode || "test");
  const [fneApiKey, setFneApiKey] = useState(companies.fne_api_key || "");
  const [fneApiUrl, setFneApiUrl] = useState(companies.fne_api_url || "");
  const [showKey, setShowKey] = useState(false);
  const [savedCompliance, setSavedCompliance] = useState(false);
  const [savedFne, setSavedFne] = useState(false);

  // Resynchronise si les donnees serveur changent (apres invalidation de la query)
  useEffect(() => {
    setCountryCode(companies.country_code || "");
    setTaxRegime(companies.tax_regime || "");
    setFiscalNumber(companies.fiscal_number || "");
    setRccmNumber(companies.rccm_number || "");
    setCapitalSocial(companies.capital_social ?? "");
    setFneMode(companies.fne_mode || "test");
    setFneApiKey(companies.fne_api_key || "");
    setFneApiUrl(companies.fne_api_url || "");
  }, [companies.country_code, companies.tax_regime, companies.fiscal_number,
      companies.rccm_number, companies.capital_social, companies.fne_mode,
      companies.fne_api_key, companies.fne_api_url]);

  const configs = (countryConfigs && countryConfigs.length > 0) ? countryConfigs : COUNTRY_FALLBACK;
  const selectedConfig = configs.find((c: any) => c.country_code === countryCode);
  const fiscalLabel = selectedConfig?.fiscal_number_label || "Numéro fiscal";
  const isCI = countryCode === "CI";

  const isPlaceholder = (v: string) => v === "A_COMPLETER_NCC" || v === "A_COMPLETER_RCCM";

  function handleSaveCompliance() {
    updateCompliance.mutate(
      { companyId: company.company_id, countryCode, taxRegime, fiscalNumber, rccmNumber, capitalSocial },
      { onSuccess: () => { setSavedCompliance(true); setTimeout(() => setSavedCompliance(false), 2000); },
        onError: (err: any) => alert("Erreur : " + err.message) }
    );
  }

  function handleSaveFne() {
    updateFne.mutate(
      { companyId: company.company_id, fneMode, fneApiKey, fneApiUrl },
      { onSuccess: () => { setSavedFne(true); setTimeout(() => setSavedFne(false), 2000); },
        onError: (err: any) => alert("Erreur : " + err.message) }
    );
  }

  return (
    <>
      <Section title="Conformité fiscale">
        <p style={{ margin: "-8px 0 4px", fontSize: 12.5, color: colors.gray[600] }}>
          Ces informations apparaissent sur vos factures et déterminent le score de conformité affiché sur chacune d'elles.
        </p>

        {(isPlaceholder(fiscalNumber) || isPlaceholder(rccmNumber)) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: palette.danger[50],
            border: "1px solid " + palette.danger.solid + "33", borderRadius: radius.md, padding: "10px 14px" }}>
            <Shield size={15} color={palette.danger.solid} />
            <span style={{ fontSize: 13, color: palette.danger.solid, fontWeight: 600 }}>
              Des valeurs provisoires sont encore utilisées ci-dessous — remplace-les par tes vrais numéros avant d'envoyer une facture à un client.
            </span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>Pays</label>
            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
              style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                width: "100%", boxSizing: "border-box" }}>
              <option value="">Sélectionner un pays</option>
              {configs.map((c: any) => <option key={c.country_code} value={c.country_code}>{c.country_name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>Régime fiscal</label>
            <select value={taxRegime} onChange={(e) => setTaxRegime(e.target.value)}
              style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                width: "100%", boxSizing: "border-box" }}>
              <option value="">Sélectionner un régime</option>
              {TAX_REGIMES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <Field label={fiscalLabel + " (numéro fiscal)"} value={fiscalNumber} onChange={setFiscalNumber} placeholder="Ex: 1234567A" />
          <Field label="Numéro RCCM" value={rccmNumber} onChange={setRccmNumber} placeholder="Ex: CI-ABJ-2024-A-00000" />
          <Field label="Capital social (FCFA, optionnel)" value={String(capitalSocial)} onChange={setCapitalSocial} type="number" placeholder="1000000" />
        </div>

        {selectedConfig?.e_invoicing_system && selectedConfig.e_invoicing_status !== "non_requis" && (
          <p style={{ margin: 0, fontSize: 12, color: colors.gray[600] }}>
            {selectedConfig.e_invoicing_system} — statut : {selectedConfig.e_invoicing_status === "obligatoire" ? "obligatoire" : "en déploiement"}
          </p>
        )}

        <button onClick={handleSaveCompliance} disabled={updateCompliance.isPending} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: radius.md,
          background: savedCompliance ? palette.green.solid : palette.primary.solid, color: colors.white,
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, alignSelf: "flex-start" }}>
          {updateCompliance.isPending ? <Loader2 size={14} className="animate-spin" />
            : savedCompliance ? <Check size={14} /> : <Save size={14} />}
          {savedCompliance ? "Enregistré" : "Enregistrer"}
        </button>
      </Section>

      {isCI && (
        <Section title="Certification FNE (Côte d'Ivoire)">
          <p style={{ margin: "-8px 0 4px", fontSize: 12.5, color: colors.gray[600] }}>
            Tant qu'aucune clé API n'est renseignée ici, les certifications FNE se font en mode simulation
            (statut "simulée" sur la facture, jamais confondu avec une vraie certification DGI).
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>Mode</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["test", "production"].map((m) => (
                <button key={m} onClick={() => setFneMode(m)} style={{
                  padding: "7px 14px", borderRadius: radius.full, border: "1px solid " + (fneMode === m ? palette.primary.solid : colors.gray[200]),
                  background: fneMode === m ? palette.primary[50] : colors.white,
                  color: fneMode === m ? palette.primary.text : colors.gray[600],
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: font, textTransform: "capitalize" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>Clé API FNE</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type={showKey ? "text" : "password"} value={fneApiKey} onChange={(e) => setFneApiKey(e.target.value)}
                placeholder="Obtenue après validation par la DGI" style={{ flex: 1, minWidth: 0, padding: "11px 14px", borderRadius: radius.md,
                  border: "1px solid " + colors.gray[200], fontSize: 14, fontFamily: font, color: colors.gray[900],
                  outline: "none", background: colors.white }} />
              <button onClick={() => setShowKey(!showKey)} style={{ padding: "0 12px", borderRadius: radius.md,
                border: "1px solid " + colors.gray[200], background: colors.white, cursor: "pointer", flexShrink: 0 }}>
                {showKey ? <EyeOff size={15} color={colors.gray[500]} /> : <Eye size={15} color={colors.gray[500]} />}
              </button>
            </div>
          </div>

          {fneMode === "production" && (
            <Field label="URL de production (fournie par la DGI)" value={fneApiUrl} onChange={setFneApiUrl} placeholder="https://..." />
          )}

          {companies.fne_balance_sticker != null && (
            <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600] }}>
              Solde de stickers restants : <strong>{companies.fne_balance_sticker}</strong>
            </p>
          )}

          <button onClick={handleSaveFne} disabled={updateFne.isPending} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: radius.md,
            background: savedFne ? palette.green.solid : palette.primary.solid, color: colors.white,
            border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, alignSelf: "flex-start" }}>
            {updateFne.isPending ? <Loader2 size={14} className="animate-spin" />
              : savedFne ? <Check size={14} /> : <Save size={14} />}
            {savedFne ? "Enregistré" : "Enregistrer"}
          </button>
        </Section>
      )}
    </>
  );
}


export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("entreprise");
  const [saved, setSaved] = useState(false);


  const { data: company } = useCompany();
  const updateSignature = useUpdateCompanySignature();
  const [pendingSignature, setPendingSignature] = useState(undefined); // undefined = pas touche
  const currentSignature = pendingSignature !== undefined ? pendingSignature : company?.companies?.signature_url ?? null;


  function handleSaveSignature() {
    if (!company?.company_id || pendingSignature === undefined) return;
    updateSignature.mutate({ companyId: company.company_id, dataUrl: pendingSignature });
  }


  // Entreprise
  const [companyName, setCompanyName] = useState("KUDU CASH");
  const [phone, setPhone] = useState("0708901208");
  const [email, setEmail] = useState("contact@entreprise.com");
  const [address, setAddress] = useState("Abidjan");


  // Facturation
  const [currency, setCurrency] = useState("XOF");
  const [tva, setTva] = useState("18");
  const [prefixDevis, setPrefixDevis] = useState("DEV");
  const [prefixFacture, setPrefixFacture] = useState("FAC");


  // Notifications
  const [notifPaiement, setNotifPaiement] = useState(true);
  const [notifEcheance, setNotifEcheance] = useState(true);
  const [notifDevis, setNotifDevis] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);


  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }


  return (
    <>
      <style>{`
        /* Sous 1367px (telephones + tablettes, meme seuil que Sidebar/BottomNav) :
           la liste d'onglets passe d'une colonne fixe de 200px a une rangee
           horizontale scrollable au-dessus du contenu, pour eviter le texte tronque
           observe quand les deux colonnes desktop sont compressees sur petit ecran. */
        .ff-settings-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }
        .ff-settings-tabs {
          width: 100%;
          flex-shrink: 0;
          background: ${colors.white};
          border-radius: ${radius.lg}px;
          border: 1px solid ${colors.gray[100]};
          box-shadow: ${shadow.card};
          padding: 8px;
          display: flex;
          flex-direction: row;
          gap: 2px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .ff-settings-tabs::-webkit-scrollbar { height: 4px; }
        .ff-settings-tab-btn {
          flex: 0 0 auto;
          white-space: nowrap;
        }
        .ff-settings-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        @media (min-width: 1367px) {
          .ff-settings-layout { flex-direction: row; align-items: flex-start; }
          .ff-settings-tabs { width: 200px; flex-direction: column; overflow-x: visible; }
          .ff-settings-tab-btn { white-space: normal; }
        }
      `}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <Header title="Parametres" />
        <button onClick={handleSave} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px",
          borderRadius:radius.md, background: saved ? palette.green.solid : palette.primary.solid,
          color:colors.white, border:"none", fontSize:13, fontWeight:700, cursor:"pointer",
          fontFamily:font, flexShrink:0, transition:"background 200ms ease" }}>
          {saved ? <><Check size={15}/> Enregistre</> : <><Save size={15}/> Enregistrer</>}
        </button>
      </div>


      <div className="ff-settings-layout">
        {/* Tabs */}
        <div className="ff-settings-tabs">
          {TABS.map(t => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} className="ff-settings-tab-btn" onClick={()=> t.path ? navigate(t.path) : setActiveTab(t.id)} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                borderRadius:radius.md, border:"none",
                background: isActive ? palette.primary[50] : "transparent",
                color: isActive ? palette.primary.text : colors.gray[600],
                fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:font, textAlign:"left",
              }}>
                <Icon size={16}/> {t.label}
                {isActive && <ChevronRight size={13} style={{ marginLeft:"auto" }}/>}
              </button>
            );
          })}
        </div>


        {/* Contenu */}
        <div className="ff-settings-content">


          {activeTab === "entreprise" && (
            <Section title="Informations de l'entreprise">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14 }}>
                <Field label="Nom de l'entreprise" value={companyName} onChange={setCompanyName} placeholder="Mon entreprise"/>
                <Field label="Telephone" value={phone} onChange={setPhone} type="tel" placeholder="+225 07 00 00 00 00"/>
                <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="contact@entreprise.com"/>
                <Field label="Adresse" value={address} onChange={setAddress} placeholder="Abidjan, Cote d'Ivoire"/>
              </div>
            </Section>
          )}


          {activeTab === "conformite" && company && <ComplianceSection company={company} />}


          {activeTab === "integrations" && company && <IntegrationsSection companyId={company.company_id} />}


          {activeTab === "facturation" && (
            <Section title="Parametres financiers">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:12.5, fontWeight:600, color:colors.gray[600] }}>Devise</label>
                  <select value={currency} onChange={(e)=>setCurrency(e.target.value)}
                    style={{ padding:"11px 14px", borderRadius:radius.md, border:"1px solid "+colors.gray[200],
                      fontSize:14, fontFamily:font, color:colors.gray[900], outline:"none", background:colors.white,
                      width:"100%", boxSizing:"border-box" }}>
                    <option value="XOF">XOF - Franc CFA</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - Dollar</option>
                  </select>
                </div>
                <Field label="TVA par defaut (%)" value={tva} onChange={setTva} type="number" placeholder="18"/>
                <Field label="Prefixe devis" value={prefixDevis} onChange={setPrefixDevis} placeholder="DEV"/>
                <Field label="Prefixe facture" value={prefixFacture} onChange={setPrefixFacture} placeholder="FAC"/>
              </div>
            </Section>
          )}


          {activeTab === "equipe" && (
            <Section title="Membres de l'equipe">
              {[
                { name:"Hubert K.", email:"baljacques62@gmail.com", role:"Administrateur", color:"primary" },
              ].map(m => (
                <div key={m.email} style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"12px 0", borderBottom:"1px solid "+colors.gray[100] }}>
                  <div style={{ width:36, height:36, borderRadius:radius.full,
                    background:palette[m.color as keyof typeof palette][50],
                    color:palette[m.color as keyof typeof palette].solid,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:700, fontSize:13, flexShrink:0 }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:colors.gray[900] }}>{m.name}</p>
                    <p style={{ margin:0, fontSize:12, color:colors.gray[400] }}>{m.email}</p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:radius.full,
                    background:palette.primary[50], color:palette.primary.solid, flexShrink:0 }}>{m.role}</span>
                </div>
              ))}
              <button style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px",
                borderRadius:radius.md, border:"1px solid "+colors.gray[200], background:colors.white,
                fontSize:13, fontWeight:600, color:colors.gray[700], cursor:"pointer", fontFamily:font }}>
                <Users size={14}/> Inviter un membre
              </button>
            </Section>
          )}


          {activeTab === "notifications" && (
            <Section title="Preferences de notifications">
              <Toggle label="Paiement recu" description="Notifier a chaque paiement enregistre"
                value={notifPaiement} onChange={setNotifPaiement}/>
              <Toggle label="Echeance imminente" description="Rappel 3 jours avant echeance"
                value={notifEcheance} onChange={setNotifEcheance}/>
              <Toggle label="Devis accepte" description="Notifier quand un devis est accepte"
                value={notifDevis} onChange={setNotifDevis}/>
              <Toggle label="Notifications par email" description="Recevoir les alertes par email"
                value={notifEmail} onChange={setNotifEmail}/>
            </Section>
          )}


          {activeTab === "securite" && (
            <Section title="Securite du compte">
              <Field label="Mot de passe actuel" value="" onChange={()=>{}} type="password" placeholder="········"/>
              <Field label="Nouveau mot de passe" value="" onChange={()=>{}} type="password" placeholder="········"/>
              <Field label="Confirmer le mot de passe" value="" onChange={()=>{}} type="password" placeholder="········"/>
              <button style={{ display:"flex", alignItems:"center", gap:6, padding:"11px 16px",
                borderRadius:radius.md, background:palette.primary.solid, color:colors.white,
                border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:font, alignSelf:"flex-start" }}>
                <Shield size={14}/> Mettre a jour
              </button>
            </Section>
          )}


          {activeTab === "signature" && (
            <Section title="Signature de l'entreprise">
              <p style={{ margin: "-8px 0 4px", fontSize: 12.5, color: colors.gray[600] }}>
                Cette signature apparaitra automatiquement sur tous vos devis et factures generes en PDF.
              </p>
              <SignaturePad value={currentSignature} onChange={setPendingSignature} />
              <button onClick={handleSaveSignature} disabled={pendingSignature === undefined || updateSignature.isPending}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px",
                  borderRadius:radius.md, alignSelf:"flex-start",
                  background: pendingSignature === undefined ? colors.gray[200] : palette.primary.solid,
                  color: pendingSignature === undefined ? colors.gray[400] : colors.white,
                  border:"none", fontSize:13, fontWeight:700,
                  cursor: pendingSignature === undefined ? "not-allowed" : "pointer", fontFamily:font }}>
                <Save size={14}/> {updateSignature.isPending ? "Enregistrement..." : "Enregistrer la signature"}
              </button>
            </Section>
          )}


          {activeTab === "abonnement" && <SubscriptionSection />}
        </div>
      </div>
    </>
  );
}