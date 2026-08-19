import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ArrowLeft } from "lucide-react";
import { useAuth } from "../../AuthContext";

const P = {
  primary: { solid:"#F97316", text:"#D85F0A", 50:"#FFF4EC" },
  gray: { 50:"#F8FAFA", 100:"#F1F3F3", 200:"#E4E7E7", 400:"#9CA6A6", 600:"#5B6666", 900:"#14181A" },
  white:"#FFFFFF",
  danger: { solid:"#E0383E", 50:"#FBEAEA" },
};
const R = { md:12, lg:16, full:9999 };
const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const BG_IMAGES = [
  "/register-1.jpg",
  "/register-2.jpg",
];

function Field({ icon:Icon, type="text", placeholder, value, onChange, right }: {
  icon:React.ElementType; type?:string; placeholder:string;
  value:string; onChange:(v:string)=>void; right?:React.ReactNode;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, background:P.gray[50],
      border:"1px solid " + P.gray[200], borderRadius:R.md, padding:"13px 14px" }}>
      <Icon size={17} color={P.gray[400]} />
      <input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
        style={{ flex:1, border:"none", outline:"none", background:"transparent",
          fontSize:14, fontFamily:font, color:P.gray[900] }} />
      {right}
    </div>
  );
}

function StepDot({ active, done }: { active:boolean; done:boolean }) {
  return (
    <div style={{ width:8, height:8, borderRadius:R.full,
      background: done||active ? P.primary.solid : P.gray[200], transition:"all 200ms ease" }} />
  );
}

function BackgroundCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BG_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="reg-bg-panel">
      {BG_IMAGES.map((src, i) => (
        <div
          key={src}
          className={"reg-bg-slide" + (i === index ? " reg-bg-slide-active" : "")}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="reg-bg-overlay" />
      <div className="reg-bg-content">
        <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight:700, lineHeight:1.3 }}>
          {"Pilotez votre facturation en toute simplicit\u00e9"}
        </h2>
        <p style={{ margin:0, fontSize:14, opacity:0.85, lineHeight:1.6 }}>
          {"Devis, factures et gestion clients, pens\u00e9s pour les entreprises africaines."}
        </p>
        <div className="reg-bg-dots">
          {BG_IMAGES.map((_, i) => (
            <span key={i} className={"reg-bg-dot" + (i === index ? " reg-bg-dot-active" : "")} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const { signUp } = useAuth() as any;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const step1Valid = fullName.trim() !== "" && email.includes("@") && password.length >= 6 && password === confirm;
  const step2Valid = company.trim() !== "";

  async function handleSubmit() {
    if(!step2Valid) return;
    setError(""); setLoading(true);
    try {
      await signUp({ email, password, fullName, company, phone, city });
      navigate("/register/company");
    } catch(err:any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reg-root" style={{ fontFamily:font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .reg-root {
          min-height: 100vh;
          display: flex;
          background: ${P.gray[50]};
        }

        .reg-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .reg-bg-panel {
          position: relative;
          flex: 1;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }

        .reg-bg-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transform: scale(1.06);
          transition: opacity 1400ms ease, transform 6000ms ease;
        }

        .reg-bg-slide-active {
          opacity: 1;
          transform: scale(1);
        }

        .reg-bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(20,24,26,0.15) 0%, rgba(20,24,26,0.75) 100%);
        }

        .reg-bg-content {
          position: relative;
          z-index: 1;
          color: #fff;
          padding: 40px;
        }

        .reg-bg-dots {
          display: flex;
          gap: 6px;
          margin-top: 18px;
        }

        .reg-bg-dot {
          width: 20px;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.35);
          transition: background 300ms ease;
        }

        .reg-bg-dot-active {
          background: #fff;
        }

        @media (max-width: 900px) {
          .reg-bg-panel { display: none; }
        }
      `}</style>

      <div className="reg-form-side">
        <div style={{ width:"100%", maxWidth:420 }}>

          <div style={{ textAlign:"center", marginBottom:28 }}>
            <img src="/logo-full.png" alt="FactureFlow Africa" style={{ width:64, height:64, borderRadius:R.md, margin:"0 auto 14px", display:"block", objectFit:"contain" }} />
            <h1 style={{ margin:"0 0 4px", fontSize:22, fontWeight:700, color:P.gray[900] }}>
              {"Cr\u00e9er un compte"}
            </h1>
            <p style={{ margin:"0 0 14px", fontSize:14, color:P.gray[600] }}>
              {step === 1 ? "Vos informations personnelles" : "Votre entreprise"}
            </p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <StepDot active={step===1} done={step>1} />
              <div style={{ width:24, height:1, background:step>1?P.primary.solid:P.gray[200] }} />
              <StepDot active={step===2} done={false} />
            </div>
          </div>

          <div style={{ background:P.white, borderRadius:R.lg, padding:28,
            boxShadow:"0 1px 2px rgba(15,18,20,0.04), 0 4px 12px rgba(15,18,20,0.06)",
            display:"flex", flexDirection:"column", gap:14 }}>

            {error && (
              <div style={{ background:P.danger[50], borderRadius:R.md, padding:"10px 14px",
                fontSize:13, color:P.danger.solid, fontWeight:500 }}>{error}</div>
            )}

            {step === 1 ? (
              <>
                <Field icon={User} placeholder="Nom complet" value={fullName} onChange={setFullName} />
                <Field icon={Mail} type="email" placeholder="votre@email.com" value={email} onChange={setEmail} />
                <Field icon={Lock} type={showPwd?"text":"password"} placeholder="Mot de passe (min. 6 car.)"
                  value={password} onChange={setPassword}
                  right={
                    <button type="button" onClick={()=>setShowPwd(p=>!p)}
                      style={{ border:"none", background:"none", cursor:"pointer", padding:0, display:"flex" }}>
                      {showPwd ? <EyeOff size={17} color={P.gray[400]}/> : <Eye size={17} color={P.gray[400]}/>}
                    </button>
                  } />
                <Field icon={Lock} type="password" placeholder="Confirmer le mot de passe"
                  value={confirm} onChange={setConfirm} />
                {confirm && password !== confirm && (
                  <p style={{ margin:0, fontSize:12, color:P.danger.solid }}>Les mots de passe ne correspondent pas.</p>
                )}
                <button disabled={!step1Valid} onClick={()=>setStep(2)} style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  padding:"13px 20px", borderRadius:R.md, border:"none",
                  background: step1Valid ? P.primary.solid : P.gray[200],
                  color: step1Valid ? P.white : P.gray[400],
                  fontSize:15, fontWeight:700, cursor: step1Valid ? "pointer" : "not-allowed", fontFamily:font,
                }}>
                  Continuer <ArrowRight size={16}/>
                </button>
              </>
            ) : (
              <>
                <Field icon={User} placeholder="Nom de l'entreprise" value={company} onChange={setCompany} />
                <Field icon={User} type="tel" placeholder="+225 07 00 00 00 00" value={phone} onChange={setPhone} />
                <Field icon={User} placeholder="Ville (ex: Abidjan)" value={city} onChange={setCity} />
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setStep(1)} style={{ display:"flex", alignItems:"center", gap:6,
                    padding:"13px 16px", borderRadius:R.md, border:"1px solid " + P.gray[200],
                    background:P.white, fontSize:14, fontWeight:600, color:P.gray[600], cursor:"pointer", fontFamily:font }}>
                    <ArrowLeft size={15}/>
                  </button>
                  <button disabled={!step2Valid||loading} onClick={handleSubmit} style={{
                    flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    padding:"13px 20px", borderRadius:R.md, border:"none",
                    background: step2Valid&&!loading ? P.primary.solid : P.gray[200],
                    color: step2Valid&&!loading ? P.white : P.gray[400],
                    fontSize:15, fontWeight:700, cursor: step2Valid&&!loading ? "pointer" : "not-allowed", fontFamily:font,
                  }}>
                    {loading ? "Inscription..." : "Terminer"}
                  </button>
                </div>
              </>
            )}
          </div>

          <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:P.gray[600] }}>
            {"D\u00e9j\u00e0 un compte ? "}
            <Link to="/login" style={{ fontWeight:700, color:P.primary.solid, textDecoration:"none" }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      <BackgroundCarousel />
    </div>
  );
}