import React, { useEffect, useRef, useState } from "react";
import {
  FileText, Users, Package, CreditCard, TrendingUp, Bell, Zap, Sparkles,
  CheckCircle2, QrCode, BarChart3, Wallet, Repeat, ClipboardList,
  ShieldCheck, ArrowRight, Menu, X, ChevronDown, Smartphone, Clock,
  Star, Mail, Check, MapPin, HeartHandshake, Lock, Headphones, Quote, Image as ImageIcon,
} from "lucide-react";
import "./landing.css";

/* ===========================================================
   Charte graphique FactureFlow Africa — l'orange est LA couleur.
   var(--color-primary-600) (marque, CTA, dégradés) · var(--color-primary-700) (hover / profondeur)
   Fond clair, encre #0F172A, police unique : Inter
=========================================================== */

function useReveal(): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}
function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity .8s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

/* ---------------- Zone réservée à une vraie image (à alimenter via le dashboard CMS) ---------------- */
interface ImagePlaceholderProps {
  label?: string;
  ratio?: string;
  className?: string;
  dark?: boolean;
}
function ImagePlaceholder({ label = "Image", ratio = "aspect-video", className = "", dark = false }: ImagePlaceholderProps) {
  return (
    <div className={`relative ${ratio} rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center px-4 ${dark ? "border-white/30 bg-white/10" : "border-orange-200 bg-orange-50/50"} ${className}`}>
      <ImageIcon size={26} className={dark ? "text-white/60" : "text-orange-300"} />
      <p className={`text-xs font-semibold ${dark ? "text-white/80" : "text-orange-500"}`}>{label}</p>
      <p className={`text-[10px] ${dark ? "text-white/50" : "text-gray-400"}`}>Zone gérée depuis le dashboard CMS</p>
    </div>
  );
}

interface CounterProps { value: number; suffix?: string; duration?: number; }
function Counter({ value, suffix = "", duration = 1300 }: CounterProps) {
  const [n, setN] = useState(0);
  const [ref, visible] = useReveal();
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const step = (t: number) => { const p = Math.min(1, (t - start) / duration); setN(Math.floor(p * value)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, [visible]);
  return <span ref={ref} className="tabular-nums">{n}{suffix}</span>;
}

/* ---------------- Séparateur courbe entre sections ---------------- */
interface WaveProps { fill?: string; flip?: boolean; }
function Wave({ fill = "#FFFFFF", flip = false }: WaveProps) {
  return (
    <div className="relative leading-[0]" style={{ transform: flip ? "scaleY(-1)" : "none" }}>
      <svg viewBox="0 0 1440 90" className="w-full h-[60px] sm:h-[90px]" preserveAspectRatio="none">
        <path fill={fill} d="M0,32 C240,90 480,0 720,24 C960,48 1200,96 1440,40 L1440,90 L0,90 Z" />
      </svg>
    </div>
  );
}

interface HexaProps { icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; size?: number; tone?: string; }
function Hexa({ icon: Icon, size = 56, tone = "1" }: HexaProps) {
  const tones: Record<string, string> = {
    1: "linear-gradient(145deg,#FDBA74,var(--color-primary-600))",
    2: "linear-gradient(145deg,#FB923C,var(--color-primary-700))",
    3: "linear-gradient(145deg,#FED7AA,var(--color-primary-600))",
  };
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size * 1.1,
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        background: tones[tone],
        boxShadow: "0 10px 24px -8px rgba(249,115,22,0.55)",
      }}
    >
      <Icon size={size * 0.42} className="text-white" strokeWidth={2} />
    </div>
  );
}

/* ---------------- Fenêtre produit générique ---------------- */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_40px_100px_-30px_rgba(249,115,22,0.35)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /><span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        <div className="ml-3 flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 text-[11px] text-gray-400">app.factureflow.africa</div>
      </div>
      {children}
    </div>
  );
}

/* ---------------- Mockups par module ---------------- */
function InvoiceMock() {
  const [step, setStep] = useState(0);
  const lines = [{ l: "Conception graphique", a: "150 000" }, { l: "Hébergement site web", a: "60 000" }, { l: "Maintenance mensuelle", a: "25 000" }];
  useEffect(() => { const t = setInterval(() => setStep((s) => (s + 1) % 5), 1300); return () => clearInterval(t); }, []);
  return (
    <BrowserFrame>
      <div className="p-6 bg-white flex justify-center">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 font-mono">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-gray-200">
            <span className="text-[11px] font-semibold text-gray-700">Facture FF-2026-0842</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-500 ${step >= 4 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{step >= 4 ? "Payée" : "En attente"}</span>
          </div>
          <div className="px-4 py-3 space-y-2 min-h-[96px]">
            {lines.map((x, i) => (
              <div key={x.l} className="flex justify-between text-[12px] text-gray-600 transition-all duration-500" style={{ opacity: step > i ? 1 : 0, transform: step > i ? "translateX(0)" : "translateX(-8px)" }}>
                <span>{x.l}</span><span className="text-gray-900">{x.a} F</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className={`text-[10px] flex items-center gap-1 font-semibold text-green-700 transition-opacity duration-500 ${step >= 3 ? "opacity-100" : "opacity-0"}`}><CheckCircle2 size={12} /> Certifiée FNE</span>
            <span className="text-sm font-bold text-gray-900">235 000 F</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function PaymentsMock() {
  const rows = [
    { name: "Établissements Koné", mode: "Orange Money", status: "Payé", amount: "480 000 F" },
    { name: "SARL Diallo & Fils", mode: "Virement", status: "En attente", amount: "215 000 F" },
    { name: "Aïcha Traoré Design", mode: "Wave", status: "Payé", amount: "95 000 F" },
  ];
  return (
    <BrowserFrame>
      <div className="p-5 bg-white">
        <table className="w-full text-[12px]">
          <thead><tr className="text-gray-400 text-left"><th className="font-medium pb-2">Client</th><th className="font-medium pb-2">Mode</th><th className="font-medium pb-2">Statut</th><th className="font-medium pb-2 text-right">Montant</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-gray-100">
                <td className="py-2.5 text-gray-800 font-medium">{r.name}</td>
                <td className="py-2.5 text-gray-500">{r.mode}</td>
                <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === "Payé" ? "bg-green-100 text-green-700" : "bg-orange-100 text-[var(--color-primary-700)]"}`}>{r.status}</span></td>
                <td className="py-2.5 text-right font-mono text-gray-900">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BrowserFrame>
  );
}

function ClientsMock() {
  const clients = [
    { i: "EK", n: "Établissements Koné", solde: "480 000 F", tag: "En retard" },
    { i: "SD", n: "SARL Diallo & Fils", solde: "0 F", tag: "À jour" },
    { i: "AT", n: "Aïcha Traoré Design", solde: "95 000 F", tag: "À jour" },
  ];
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-3">
        {clients.map((c) => (
          <div key={c.n} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: "linear-gradient(145deg,#FB923C,var(--color-primary-700))" }}>{c.i}</div>
              <span className="text-[13px] font-medium text-gray-800">{c.n}</span>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-mono text-gray-900">{c.solde}</p>
              <p className={`text-[10px] font-semibold ${c.tag === "À jour" ? "text-green-600" : "text-[var(--color-primary-700)]"}`}>{c.tag}</p>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function DepensesMock() {
  const cats = [{ n: "Loyer", v: 70, m: "150 000 F" }, { n: "Fournitures", v: 40, m: "62 000 F" }, { n: "Transport", v: 55, m: "38 000 F" }, { n: "Logiciels", v: 25, m: "21 000 F" }];
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-3">
        {cats.map((c) => (
          <div key={c.n}>
            <div className="flex justify-between text-[12px] text-gray-600 mb-1"><span>{c.n}</span><span className="font-mono text-gray-900">{c.m}</span></div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.v}%`, background: "linear-gradient(90deg,#FDBA74,var(--color-primary-600))" }} /></div>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between text-[13px] font-semibold"><span className="text-gray-700">Marge nette estimée</span><span className="text-[var(--color-primary-700)]">62%</span></div>
      </div>
    </BrowserFrame>
  );
}

function StockMock() {
  const items = [
    { n: "Papier A4 (rame)", q: 8, tag: "Stock faible" },
    { n: "Cartouches d'encre", q: 0, tag: "Rupture" },
    { n: "Housses ordinateur", q: 42, tag: "En stock" },
  ];
  const tagColor: Record<string, string> = { "Stock faible": "bg-orange-100 text-[var(--color-primary-700)]", "Rupture": "bg-red-100 text-red-600", "En stock": "bg-green-100 text-green-700" };
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-2.5">
        {items.map((it) => (
          <div key={it.n} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
            <span className="text-[13px] font-medium text-gray-800">{it.n}</span>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono text-gray-500">{it.q} unités</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColor[it.tag]}`}>{it.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function AchatsMock() {
  const orders = [
    { f: "Fournisseur Kouassi Matériaux", statut: "Reçue", montant: "320 000 F" },
    { f: "Distri-Bureau CI", statut: "En cours", montant: "58 000 F" },
    { f: "TechImport SARL", statut: "En attente", montant: "410 000 F" },
  ];
  const tagColor: Record<string, string> = { "Reçue": "bg-green-100 text-green-700", "En cours": "bg-blue-100 text-blue-600", "En attente": "bg-orange-100 text-[var(--color-primary-700)]" };
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-2.5">
        {orders.map((o) => (
          <div key={o.f} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
            <span className="text-[13px] font-medium text-gray-800">{o.f}</span>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColor[o.statut]}`}>{o.statut}</span>
              <span className="text-[12px] font-mono text-gray-900">{o.montant}</span>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function TresorerieMock() {
  const flux = [
    { m: "Encaissements", v: 82, c: "#16A34A" },
    { m: "Décaissements", v: 48, c: "var(--color-primary-600)" },
  ];
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[{ l: "Comptes cumulés", v: "2 140 000 F" }, { l: "Solde prévisionnel (30j)", v: "+ 640 000 F" }].map((k) => (
            <div key={k.l} className="bg-gray-50 rounded-lg border border-gray-200 p-3"><p className="text-[10px] text-gray-400">{k.l}</p><p className="text-sm font-bold text-gray-900 mt-1">{k.v}</p></div>
          ))}
        </div>
        <div className="space-y-2">
          {flux.map((f) => (
            <div key={f.m}>
              <div className="flex justify-between text-[12px] text-gray-600 mb-1"><span>{f.m}</span></div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${f.v}%`, background: f.c }} /></div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function RecouvrementMock() {
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--color-primary-700)] uppercase tracking-wide"><Sparkles size={13} /> Suggestions IA</div>
        {[
          { c: "Établissements Koné", p: "82%", msg: "Relancer aujourd'hui par SMS" },
          { c: "SARL Diallo & Fils", p: "54%", msg: "Proposer un échéancier" },
        ].map((r) => (
          <div key={r.c} className="border border-orange-100 bg-orange-50/60 rounded-lg px-3 py-2.5">
            <div className="flex justify-between text-[13px] font-medium text-gray-800"><span>{r.c}</span><span className="text-[var(--color-primary-700)] font-mono text-[12px]">{r.p}</span></div>
            <p className="text-[12px] text-gray-500 mt-1">{r.msg}</p>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function RHMock() {
  const team = [
    { i: "MK", n: "Marie Koffi", role: "Comptable", statut: "Actif" },
    { i: "SB", n: "Seydou Bamba", role: "Commercial", statut: "Actif" },
    { i: "JN", n: "Julie N'Guessan", role: "Livreur", statut: "Congé" },
  ];
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-2.5">
        {team.map((t) => (
          <div key={t.n} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: "linear-gradient(145deg,#FDBA74,var(--color-primary-700))" }}>{t.i}</div>
              <div><p className="text-[13px] font-medium text-gray-800">{t.n}</p><p className="text-[11px] text-gray-400">{t.role}</p></div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.statut === "Actif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t.statut}</span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function DashboardMock({ tilt = false }: { tilt?: boolean }) {
  const [bars, setBars] = useState([30, 30, 30, 30, 30]);
  useEffect(() => { const t = setTimeout(() => setBars([55, 70, 45, 88, 64]), 300); return () => clearTimeout(t); }, []);
  return (
    <div style={tilt ? { transform: "perspective(1400px) rotateY(-6deg) rotateX(3deg)", transformStyle: "preserve-3d" } : {}}>
      <BrowserFrame>
        <div className="flex">
          <div className="w-14 bg-gray-900 py-4 flex flex-col items-center gap-4">
            {[BarChart3, FileText, Users, Wallet, Bell].map((Icon, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={i === 0 ? { background: "linear-gradient(145deg,#FDBA74,var(--color-primary-600))" } : { background: "rgba(255,255,255,0.1)" }}><Icon size={14} className="text-white" /></div>
            ))}
          </div>
          <div className="flex-1 p-5 bg-[#F9FAFB]">
            <div className="grid grid-cols-3 gap-3">
              {[{ l: "Encaissé ce mois", v: "1 240 000 F", c: "text-gray-900" }, { l: "En attente", v: "380 000 F", c: "text-[var(--color-primary-700)]" }, { l: "Factures FNE", v: "42", c: "text-green-600" }].map((k) => (
                <div key={k.l} className="bg-white rounded-lg border border-gray-200 p-3"><p className="text-[10px] text-gray-400">{k.l}</p><p className={`text-sm font-bold mt-1 ${k.c}`}>{k.v}</p></div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 mt-3 p-4 flex items-end gap-2 h-24">
              {bars.map((h, i) => <div key={i} className="flex-1 rounded-t-sm transition-all duration-700 ease-out" style={{ height: `${h}%`, background: "linear-gradient(180deg,#FDBA74,var(--color-primary-600))" }} />)}
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

function AutomationMock() {
  return (
    <BrowserFrame>
      <div className="p-5 bg-white space-y-4">
        <div className="flex items-center gap-2 flex-wrap text-[12px]">
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">Facture impayée</span>
          <span className="px-2 py-1 rounded bg-gray-50 text-gray-400">après</span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">7 jours</span>
          <ArrowRight size={13} className="text-gray-400" />
          <span className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-600)]/10 text-[var(--color-primary-700)] font-semibold flex items-center gap-1"><Mail size={12} /> Email de relance</span>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest">Assistant IA</p>
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-[12px] text-gray-600 mb-2">« Quel client me doit le plus ? »</div>
          <div className="bg-[var(--color-primary-600)]/10 rounded-lg px-3 py-2 text-[12px] text-[var(--color-primary-700)] font-medium">Établissements Koné — 480 000 F, échue depuis 12 jours.</div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------- Données ---------------- */
const tabs = [
  { key: "facturer", label: "Facturation", icon: FileText, title: "Des factures certifiées FNE, prêtes en un clic", text: "Choisissez un client et vos articles : la facture se met en forme, se numérote et reçoit son QR code de certification automatiquement.", bullets: ["Modèles PDF personnalisables (logo, couleurs)", "Facturation récurrente pour vos abonnements", "Devis transformés en facture sans ressaisie", "QR code FNE apposé automatiquement"], mock: <InvoiceMock /> },
  { key: "stock", label: "Stock", icon: Package, badge: "Nouveau", title: "Ne soyez plus jamais pris au dépourvu", text: "Suivez vos niveaux de stock en temps réel et repérez en un coup d'œil les articles en rupture ou à réapprovisionner.", bullets: ["Alertes automatiques de stock faible ou en rupture", "Historique des mouvements par article", "Lien direct avec vos achats et vos ventes", "Valorisation du stock en temps réel"], mock: <StockMock /> },
  { key: "achats", label: "Achats", icon: ClipboardList, badge: "Nouveau", title: "Vos commandes fournisseurs, centralisées", text: "Suivez chaque commande, de son émission à sa réception, et gardez une vision claire de vos engagements financiers.", bullets: ["Suivi du statut de chaque commande", "Réception liée automatiquement au stock", "Historique par fournisseur", "Rapprochement avec les dépenses"], mock: <AchatsMock /> },
  { key: "encaisser", label: "Paiements", icon: CreditCard, title: "Suivez chaque encaissement, quel que soit le canal", text: "Orange Money, MTN MoMo, Wave, virement ou espèces : le statut de la facture se met à jour dès que le règlement est enregistré.", bullets: ["Compatible avec les principaux Mobile Money", "Statuts automatiques : envoyée, en retard, payée", "Relances programmées sans intervention", "Historique complet par facture"], mock: <PaymentsMock /> },
  { key: "tresorerie", label: "Trésorerie", icon: TrendingUp, badge: "Nouveau", title: "Vos comptes et votre trésorerie, sous contrôle", text: "Regroupez vos comptes bancaires et Mobile Money, et anticipez vos besoins de trésorerie à 30 jours.", bullets: ["Vue consolidée de tous vos comptes", "Prévisionnel de trésorerie automatique", "Rapprochement bancaire simplifié", "Alertes en cas de solde critique"], mock: <TresorerieMock /> },
  { key: "recouvrement", label: "Recouvrement IA", icon: ShieldCheck, badge: "IA", title: "L'IA identifie qui relancer, et comment", text: "L'assistant analyse l'historique de paiement de chaque client et vous recommande la meilleure action de recouvrement.", bullets: ["Score de probabilité de paiement par client", "Recommandation du bon canal de relance", "Priorisation automatique des impayés", "Suivi de l'efficacité des relances"], mock: <RecouvrementMock /> },
  { key: "clients", label: "Clients", icon: Users, title: "Une vue claire sur chaque client", text: "Coordonnées, solde, historique de facturation : tout est centralisé pour préparer un rendez-vous ou relancer en confiance.", bullets: ["Fiche client complète et recherche instantanée", "Solde dû visible en un coup d'œil", "Segmentation par statut ou volume d'affaires", "Devis illimités liés à chaque client"], mock: <ClientsMock /> },
  { key: "rh", label: "Ressources humaines", icon: Users, badge: "Nouveau", title: "Votre équipe, gérée depuis le même outil", text: "Centralisez les fiches de votre personnel, leurs rôles et leur statut, sans jongler avec un fichier séparé.", bullets: ["Fiches employés et rôles d'accès", "Suivi des statuts (actif, congé)", "Lien avec les dépenses de personnel", "Historique par collaborateur"], mock: <RHMock /> },
  { key: "depenses", label: "Dépenses", icon: Wallet, title: "Connaissez votre marge réelle, pas seulement votre CA", text: "Classez vos charges par catégorie et comparez-les à vos encaissements pour piloter la rentabilité, pas seulement le chiffre d'affaires.", bullets: ["Dépenses classées par catégorie", "Calcul automatique de la marge nette", "Export pour votre comptable", "Comparatif mois par mois"], mock: <DepensesMock /> },
  { key: "piloter", label: "Pilotage", icon: BarChart3, title: "Votre activité, lisible en un coup d'œil", text: "Le dashboard agrège ventes, encaissements et échéances en temps réel. Les rapports s'exportent en un clic pour votre comptable.", bullets: ["Indicateurs de trésorerie en direct", "Rapports exportables (PDF / tableur)", "Historique par client et par produit", "Vue consolidée multi-entreprises"], mock: <DashboardMock /> },
  { key: "automatiser", label: "Automatisation & IA", icon: Sparkles, badge: "Nouveau", title: "Ce qui travaille pendant que vous êtes sur le terrain", text: "Définissez une règle une seule fois — relance, tâche, notification — et laissez FactureFlow l'exécuter. L'assistant IA répond en français, à partir de vos données réelles.", bullets: ["6 déclencheurs, 3 types d'actions", "Vérification périodique automatique", "Assistant IA en langage naturel", "Notifications en temps réel"], mock: <AutomationMock /> },
];

const whySections = [
  { icon: Clock, tone: "1", title: "Gagnez un temps précieux", points: ["Facture générée et certifiée FNE en moins d'une minute", "Devis transformés en facture sans ressaisie", "Catalogue d'articles et de clients réutilisable à volonté", "Modèles PDF prêts à l'emploi, personnalisables à votre image"] },
  { icon: ShieldCheck, tone: "2", title: "Soyez en conformité, sans y penser", points: ["QR code de certification FNE apposé automatiquement", "Numérotation continue et sécurisée des factures", "Mentions légales toujours à jour", "Historique conservé pour vos obligations fiscales"] },
  { icon: Wallet, tone: "3", title: "Encaissez plus vite", points: ["Suivi des règlements Orange Money, MTN MoMo, Wave", "Statuts de facture mis à jour automatiquement", "Relances programmées sans intervention manuelle", "Visibilité immédiate sur les impayés"] },
  { icon: TrendingUp, tone: "1", title: "Gardez un œil sur votre rentabilité", points: ["Dashboard de trésorerie en temps réel", "Suivi des dépenses par catégorie", "Rapports exportables pour votre comptable", "Comparatif de performance mois par mois"] },
  { icon: HeartHandshake, tone: "2", title: "Profitez d'un accompagnement local", points: ["Interface pensée pour les réalités des PME ivoiriennes", "Support en français, réactif", "Assistant IA disponible à tout moment", "Aucune carte bancaire requise pour démarrer"] },
];

const onboardingSteps = [
  { n: "01", t: "Créez votre compte FactureFlow", d: "Inscrivez votre entreprise en quelques minutes, sans carte bancaire." },
  { n: "02", t: "Configurez votre espace", d: "Ajoutez votre logo, vos informations légales et vos préférences de certification FNE." },
  { n: "03", t: "Importez clients et produits", d: "Démarrez rapidement grâce à l'import de vos données existantes." },
  { n: "04", t: "Facturez et pilotez", d: "Émettez vos premières factures certifiées et suivez votre trésorerie en temps réel." },
];

const plans = [
  { name: "Gratuit", monthly: 0, yearly: 0, tag: null, points: ["Jusqu'à 5 factures / mois", "1 utilisateur", "Modèles PDF standards", "Certification FNE incluse"] },
  { name: "Starter", monthly: 9900, yearly: 7900, tag: null, points: ["Factures et devis illimités", "Suivi des paiements", "3 utilisateurs", "Support par email"] },
  { name: "Pro", monthly: 24900, yearly: 19900, tag: "Le plus choisi", points: ["Automatisation complète", "Assistant IA inclus", "Rapports avancés", "Support prioritaire"] },
  { name: "Business", monthly: null, yearly: null, tag: null, points: ["Multi-utilisateurs", "Multi-entreprises", "Accompagnement dédié", "Tarif sur mesure"] },
];

const faqs = [
  { q: "Mes factures sont-elles conformes à la réglementation ivoirienne ?", a: "Oui. Chaque facture générée sur FactureFlow intègre le QR code de certification FNE requis par la DGI, sans démarche supplémentaire de votre part." },
  { q: "Puis-je encaisser via Mobile Money ?", a: "Le suivi des paiements couvre Orange Money, MTN MoMo, Wave, virement et espèces : le statut de la facture se met à jour automatiquement dès que le règlement est enregistré." },
  { q: "Est-ce adapté si je ne suis pas à l'aise avec l'informatique ?", a: "L'interface est pensée pour être utilisable dès la première connexion : créer une facture ne demande pas plus d'étapes que rédiger un message." },
  { q: "Comment fonctionne l'assistant IA ?", a: "Posez une question en français sur votre activité — clients, échéances, chiffre d'affaires — et l'assistant répond à partir de vos données réelles, directement dans le dashboard." },
  { q: "Puis-je essayer avant de m'engager ?", a: "Oui, l'offre Gratuit permet de tester la facturation et la certification FNE sans limite de durée ni carte bancaire." },
  { q: "Que se passe-t-il si j'arrête mon abonnement ?", a: "Vos données restent exportables à tout moment. Aucune facture ni aucun client n'est verrouillé sur la plateforme." },
  { q: "Puis-je gérer plusieurs entreprises depuis un seul compte ?", a: "Oui, l'offre Business permet de piloter plusieurs structures depuis une interface unique." },
  { q: "FactureFlow est-il disponible dans mon pays ?", a: "FactureFlow est utilisable dans les 8 pays de la zone UEMOA, avec facturation en FCFA. La certification FNE, spécifique à la réglementation ivoirienne, est disponible pour la Côte d'Ivoire ; les équivalents pour les autres pays sont ajoutés progressivement." },
];

/* ---------------- App ---------------- */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [annual, setAnnual] = useState(true);
  const [showFloatCta, setShowFloatCta] = useState(false);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 12); setShowFloatCta(window.scrollY > 700); };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const countries = [
    { city: "Abidjan", pays: "Côte d'Ivoire" },
    { city: "Dakar", pays: "Sénégal" },
    { city: "Bamako", pays: "Mali" },
    { city: "Ouagadougou", pays: "Burkina Faso" },
    { city: "Cotonou", pays: "Bénin" },
    { city: "Lomé", pays: "Togo" },
    { city: "Niamey", pays: "Niger" },
    { city: "Bissau", pays: "Guinée-Bissau" },
  ];

  const navLinks = [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Pourquoi FactureFlow", href: "#pourquoi" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "FAQ", href: "#faq" },
  ];
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const dotGrid = "radial-gradient(circle,#FDBA74 1px,transparent 1px)";

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-mono-ff { font-family: 'IBM Plex Mono', monospace; }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(0.4deg); } }
        @keyframes blob { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(25px,-18px) scale(1.06); } 66% { transform: translate(-18px,12px) scale(0.96); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.45); } 50% { box-shadow: 0 0 0 14px rgba(249,115,22,0); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform: translateY(0);} }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes popIn { from { opacity:0; transform: scale(0.7) translateY(10px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-blob { animation: blob 15s ease-in-out infinite; }
        .anim-pulse { animation: pulseGlow 2.4s ease-in-out infinite; }
        .anim-marquee { animation: marquee 22s linear infinite; }
        .anim-popin { animation: popIn 0.4s cubic-bezier(.34,1.56,.64,1); }
        @media (prefers-reduced-motion: reduce) { .anim-float,.anim-blob,.anim-pulse,.anim-marquee { animation: none !important; } * { transition-duration: .01ms !important; } }
      `}</style>

      {/* NAV */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm" : "bg-transparent"}`}>
        <div className="hidden sm:flex items-center justify-center gap-2 text-[12px] font-semibold text-white py-1.5" style={{ background: "linear-gradient(90deg,#EA580C,var(--color-primary-600),#EA580C)" }}>
          <Sparkles size={12} /> Disponible dans les 8 pays de la zone UEMOA — même plateforme, même FCFA
        </div>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/30" style={{ background: "linear-gradient(145deg,#FDBA74,var(--color-primary-600))" }}><span className="text-white text-xs font-extrabold">FF</span></div>
            <span className="text-lg font-bold tracking-tight">FactureFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">{navLinks.map((l) => <a key={l.label} href={l.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.label}</a>)}</nav>
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-sm font-semibold text-gray-600 hover:text-gray-900">Connexion</a>
            <a href="#" className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-transform hover:scale-105" style={{ background: "linear-gradient(135deg,#FB923C,var(--color-primary-600))" }}>Essai gratuit</a>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-3">
            {navLinks.map((l) => <a key={l.label} href={l.href} className="block text-sm text-gray-700">{l.label}</a>)}
            <a href="#" className="block text-sm font-semibold text-white bg-[var(--color-primary-600)] px-4 py-2 rounded-lg text-center">Essai gratuit</a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-36 sm:pt-40 pb-0 px-6" style={{ backgroundImage: `${dotGrid}`, backgroundSize: "22px 22px", backgroundPosition: "-11px -11px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white pointer-events-none" style={{ maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)" }} />
        <div className="anim-blob absolute -top-24 -left-20 w-[30rem] h-[30rem] rounded-full bg-[var(--color-primary-600)]/15 blur-3xl" />
        <div className="anim-blob absolute top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#FDBA74]/25 blur-3xl" style={{ animationDelay: "3s" }} />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center pb-16">
          {/* Colonne gauche : texte */}
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white px-4 py-2 rounded-full shadow-lg shadow-orange-500/30" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }}>
              <ShieldCheck size={14} /> Conforme DGI · Certification FNE
            </span>
            <h1 className="text-4xl sm:text-5xl leading-[1.1] font-extrabold tracking-tight mt-6 uppercase">
              La suite ERP<br />
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,var(--color-primary-600),#EA580C)" }}>nouvelle génération</span>
                <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0,7 Q50,0 100,6 T200,5" stroke="#FDBA74" strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
              </span><br />
              pour l'Afrique de l'Ouest
            </h1>
            <p className="text-gray-600 text-base mt-6 max-w-md normal-case">Facturation certifiée, stock, achats, trésorerie, RH et automatisation par IA — toute la gestion de votre entreprise, dans un seul outil.</p>

            <ul className="mt-7 space-y-2.5">
              {[
                "Logiciel de facturation 100% conforme FNE",
                "Sans engagement, sans carte bancaire",
                "Stock, achats, trésorerie et RH intégrés",
                "Paiement Mobile Money : Orange, MTN, Wave",
                "Assistant IA et automatisation inclus",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-gray-700"><Check size={16} className="text-[var(--color-primary-600)] shrink-0" /> {b}</li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <a href="#" className="anim-pulse inline-flex items-center gap-2 text-sm font-semibold text-white px-7 py-3.5 rounded-lg transition-transform hover:scale-105" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }}>S'inscrire gratuitement <ArrowRight size={16} /></a>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[var(--color-primary-600)]" /> Conforme DGI</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[var(--color-primary-600)]" /> 8 pays UEMOA</span>
              <span className="flex items-center gap-1.5"><Headphones size={14} className="text-[var(--color-primary-600)]" /> Support en français</span>
            </div>
          </div>

          {/* Colonne droite : mockup superposé façon Tiime */}
          <div className="relative h-[420px] hidden md:block">
            <div className="absolute top-4 right-0 w-[380px] anim-float" style={{ transform: "rotate(2deg)" }}>
              <DashboardMock tilt />
            </div>

            {/* Mockup téléphone superposé */}
            <div className="absolute bottom-0 left-2 w-[190px] rounded-2xl bg-white border border-gray-200 shadow-2xl shadow-orange-500/20 p-2.5 anim-float" style={{ transform: "rotate(-4deg)", animationDelay: "0.6s" }}>
              <div className="flex justify-center pt-1.5 pb-2"><div className="w-12 h-1.5 rounded-full bg-gray-200" /></div>
              <p className="px-2 text-[10px] font-semibold text-gray-400 mb-2">Factures récentes</p>
              <div className="px-2 pb-2 space-y-2">
                {[{ n: "Koné", s: "bg-green-500" }, { n: "Diallo & Fils", s: "bg-[var(--color-primary-600)]" }, { n: "Traoré Design", s: "bg-green-500" }].map((r) => (
                  <div key={r.n} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
                    <span className="text-[11px] text-gray-600 font-medium">{r.n}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.s}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Badges flottants */}
            <div className="hidden lg:flex absolute top-0 left-6 items-center gap-2 bg-white rounded-xl shadow-2xl shadow-orange-500/20 px-3.5 py-2.5 border border-orange-100 anim-float">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary-600)]" /><span className="text-[11px] font-semibold text-gray-700">En retard</span>
            </div>
            <div className="hidden lg:flex absolute bottom-24 right-0 items-center gap-2 bg-white rounded-xl shadow-2xl shadow-orange-500/20 px-3.5 py-2.5 border border-orange-100 anim-float" style={{ animationDelay: "1.2s" }}>
              <CheckCircle2 size={14} className="text-green-600" /><span className="text-[11px] font-semibold text-gray-700">À jour</span>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 bg-white rounded-xl shadow-2xl shadow-orange-500/25 px-4 py-3 border border-orange-100 anim-float" style={{ animationDelay: "2s" }}>
              <QrCode size={22} className="text-[var(--color-primary-600)]" />
              <div className="leading-tight"><p className="text-[11px] font-bold text-gray-900">Certification FNE</p><p className="text-[9px] text-gray-400">Conforme DGI Côte d'Ivoire</p></div>
            </div>
          </div>
        </div>

        {/* Bandeau de confiance */}
        <Reveal className="max-w-5xl mx-auto mt-4 relative pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: MapPin, t: "Présence régionale", s: "8 pays de la zone UEMOA" },
              { icon: ShieldCheck, t: "Conformité fiscale locale", s: "Certification FNE en Côte d'Ivoire" },
              { icon: Smartphone, t: "Mobile Money", s: "Orange, MTN, Moov, Wave, Free Money" },
              { icon: Lock, t: "Données sécurisées", s: "Hébergement Supabase chiffré" },
            ].map((b) => (
              <div key={b.t} className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 hover:bg-orange-50 transition-colors">
                <b.icon size={18} className="text-[var(--color-primary-600)] shrink-0" />
                <div className="text-left"><p className="text-xs font-semibold text-gray-800 leading-tight">{b.t}</p><p className="text-[11px] text-gray-500 leading-tight">{b.s}</p></div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* MARQUEE — villes de la sous-région */}
      <div className="relative overflow-hidden border-y border-orange-100 bg-[#FFF7ED] py-4">
        <div className="flex w-max anim-marquee">
          {[...countries, ...countries].map((c, i) => (
            <span key={i} className="flex items-center gap-2 mx-6 text-sm font-semibold text-[var(--color-primary-700)] whitespace-nowrap">
              <MapPin size={14} /> {c.city} <span className="text-gray-400 font-normal">· {c.pays}</span>
            </span>
          ))}
        </div>
      </div>

      {/* PRÉSENCE RÉGIONALE */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Une seule plateforme, toute la sous-région</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Pensé pour l'Afrique de l'Ouest, pas seulement pour un pays</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">FactureFlow s'adresse aux entreprises de toute la zone UEMOA. Un avantage concret : une seule monnaie, le FCFA, du Sénégal au Niger — vos factures et vos rapports restent lisibles d'un pays à l'autre.</p>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
            {countries.map((c, i) => (
              <Reveal key={c.city} delay={i * 60}>
                <div className="rounded-2xl border border-orange-100 bg-[#FFF7ED] px-4 py-5 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-9 h-9 rounded-full mx-auto flex items-center justify-center mb-2" style={{ background: "linear-gradient(145deg,#FDBA74,var(--color-primary-600))" }}>
                    <MapPin size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{c.city}</p>
                  <p className="text-[11px] text-gray-500">{c.pays}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="text-xs text-gray-400 mt-8 max-w-xl mx-auto">
              La certification FNE est aujourd'hui disponible pour la Côte d'Ivoire. Les spécificités fiscales des autres pays de la zone sont intégrées progressivement.
            </p>
          </Reveal>
        </div>
      </section>

      <Wave fill="#0F172A" />

      {/* STATS */}
      <section className="px-6 py-16 relative overflow-hidden" style={{ background: "linear-gradient(180deg,#0F172A,#1C1917)" }}>
        <div className="anim-blob absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[var(--color-primary-600)]/20 blur-3xl" />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white relative">
          {[{ v: 16, s: "", l: "Modules ERP intégrés" }, { v: 3, s: "", l: "Opérateurs Mobile Money" }, { v: 100, s: "%", l: "Conforme FNE / DGI" }, { v: 60, s: "s", l: "Pour créer une facture" }].map((s) => (
            <div key={s.l}>
              <p className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#FDBA74,var(--color-primary-600))" }}><Counter value={s.v} suffix={s.s} /></p>
              <p className="text-xs text-gray-400 mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <Wave fill="#FFFFFF" flip />

      {/* SHOWCASE À ONGLETS */}
      <section id="fonctionnalites" className="px-6 pb-24 pt-4">
        <div className="max-w-6xl mx-auto">
          <Reveal className="max-w-xl mx-auto text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Une suite ERP complète</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Explorez chaque module en un clic</h2>
          </Reveal>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {tabs.map((t, i) => {
              const active = activeTab === i;
              return (
                <button key={t.key} onClick={() => setActiveTab(i)} className="relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all"
                  style={active ? { background: "linear-gradient(135deg,#FB923C,#EA580C)", color: "white", borderColor: "transparent", boxShadow: "0 8px 20px -6px rgba(249,115,22,0.55)" } : { background: "white", color: "#4B5563", borderColor: "#E5E7EB" }}>
                  <t.icon size={15} /> {t.label}
                  {t.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : t.badge === "IA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-[var(--color-primary-700)]"}`}>{t.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div key={activeTab} className="grid md:grid-cols-2 gap-14 items-center" style={{ animation: "fadeIn .5s ease" }}>
            <div>{tabs[activeTab].mock}</div>
            <div>
              <Hexa icon={tabs[activeTab].icon} size={52} tone="1" />
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-4">{tabs[activeTab].title}</h3>
              <p className="text-gray-600 mt-4 leading-relaxed">{tabs[activeTab].text}</p>
              <ul className="mt-6 space-y-3">
                {tabs[activeTab].bullets.map((b) => <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700"><CheckCircle2 size={17} className="text-[var(--color-primary-600)] mt-0.5 shrink-0" /> {b}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTIONS CHECK-LIST ALTERNÉES avec hexagones */}
      <section id="pourquoi" className="px-6 py-24 bg-[#FFF7ED] relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative">
          <Reveal className="max-w-xl mx-auto text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Pourquoi FactureFlow</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Concentrez-vous sur votre activité, on s'occupe du reste</h2>
          </Reveal>
          <div className="space-y-14">
            {whySections.map((s, i) => (
              <Reveal key={s.title}>
                <div className={`grid md:grid-cols-[auto_1fr] gap-8 items-start bg-white rounded-3xl p-8 shadow-[0_20px_60px_-30px_rgba(249,115,22,0.35)] border border-orange-100 ${i % 2 ? "md:[&>*:first-child]:order-2 md:[&>*:first-child]:justify-self-end" : ""}`}>
                  <Hexa icon={s.icon} size={72} tone={s.tone} />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">{s.title}</h3>
                    <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      {s.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-sm text-gray-700"><Check size={16} className="text-[var(--color-primary-600)] mt-0.5 shrink-0" /> {p}</li>)}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BANNIÈRE "PLATEFORME GRATUITE" + ÉTAPES — façon Tiime */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="rounded-3xl overflow-hidden grid md:grid-cols-2 gap-10 p-10 md:p-14 relative" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }}>
              <div className="anim-blob absolute -top-16 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight uppercase">
                  La suite ERP<br />
                  <span className="inline-block bg-gray-900 text-white px-4 py-1.5 rounded-full text-xl sm:text-2xl mt-2">100% gratuite pour démarrer</span>
                </h3>
                <p className="text-orange-50 mt-5 max-w-md">FactureFlow est une solution complète — facturation certifiée FNE, stock, achats, trésorerie, RH — que vous pouvez essayer sans frais cachés et sans engagement.</p>
                <a href="#" className="inline-flex items-center gap-2 mt-7 text-sm font-semibold text-[var(--color-primary-700)] bg-white hover:bg-orange-50 px-6 py-3 rounded-lg transition-colors">S'équiper sans engagement</a>
              </div>
              <div className="relative flex items-center">
                <ImagePlaceholder label="Visuel produit (capture d'écran ou illustration à ajouter)" ratio="aspect-[4/3]" className="w-full" dark />
                <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-green-500 text-white flex flex-col items-center justify-center text-[9px] font-extrabold text-center shadow-xl leading-tight">100%<br />FNE</div>
              </div>
            </div>
          </Reveal>

          <Reveal className="text-center mt-20 mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Passez sur la <span className="inline-block bg-orange-100 text-[var(--color-primary-700)] px-3 py-1 rounded-full">suite ERP</span> FactureFlow
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {onboardingSteps.map((s, i) => (
              <Reveal key={s.n} delay={i * 100} className={`flex items-start gap-6 ${i % 2 ? "md:mt-16" : ""}`}>
                <span className="text-4xl font-extrabold text-orange-200 shrink-0">{s.n}</span>
                <div><h4 className="font-bold text-gray-900">{s.t}</h4><p className="text-sm text-gray-500 mt-1.5">{s.d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="px-6 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Tarifs</p>
            <h2 className="text-3xl font-extrabold tracking-tight mt-3">Des offres simples, qui évoluent avec vous</h2>
            <div className="inline-flex items-center gap-1 mt-6 bg-gray-100 rounded-full p-1">
              <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${!annual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Mensuel</button>
              <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${annual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Annuel <span className="text-[var(--color-primary-600)]">-20%</span></button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Montants indicatifs en FCFA — à confirmer avant mise en ligne</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mt-10">
            {plans.map((p, i) => {
              const price = annual ? p.yearly : p.monthly;
              return (
                <Reveal key={p.name} delay={i * 90}>
                  <div className={`rounded-2xl p-6 h-full text-left flex flex-col relative ${p.tag ? "text-white shadow-2xl scale-[1.05]" : "border border-gray-200 bg-white"}`} style={p.tag ? { background: "linear-gradient(160deg,#FB923C,var(--color-primary-700))" } : {}}>
                    {p.tag && <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white px-2 py-1 rounded-full w-fit mb-2">{p.tag}</span>}
                    <p className={`font-bold ${p.tag ? "text-white" : "text-gray-900"}`}>{p.name}</p>
                    <p className="text-2xl font-extrabold mt-2">
                      {price === null ? "Sur devis" : price === 0 ? "0 F" : `${fmt(price)} F`}
                      {price !== null && price !== 0 && <span className={`text-xs font-medium ${p.tag ? "text-white/70" : "text-gray-400"}`}>/mois</span>}
                    </p>
                    <ul className="mt-5 space-y-2.5 flex-1">
                      {p.points.map((pt) => <li key={pt} className={`text-[13px] flex items-start gap-2 ${p.tag ? "text-white/90" : "text-gray-600"}`}><Check size={14} className={`mt-0.5 shrink-0 ${p.tag ? "text-white" : "text-[var(--color-primary-600)]"}`} /> {pt}</li>)}
                    </ul>
                    <a href="#" className={`mt-6 text-sm font-semibold text-center py-2.5 rounded-lg transition-colors ${p.tag ? "bg-white text-[var(--color-primary-700)] hover:bg-orange-50" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Choisir</a>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="px-6 py-24 bg-[#FFF7ED]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Ils gagnent du temps</p>
            <h2 className="text-3xl font-extrabold tracking-tight mt-3">Ce que nos clients en pensent</h2>
            <p className="text-gray-400 text-sm mt-2">Espace réservé — à remplacer par de vraies citations avant mise en ligne.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-6 h-full relative">
                  <Quote size={28} className="text-orange-200 absolute top-4 right-5" />
                  <div className="flex gap-0.5 mb-3">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={13} className="text-orange-200 fill-orange-200" />)}</div>
                  <p className="text-gray-400 text-sm italic">« Citation client à insérer ici. »</p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-7 h-7 rounded-full border border-dashed border-orange-300 bg-orange-50 flex items-center justify-center"><ImageIcon size={11} className="text-orange-300" /></div>
                    <p className="text-xs font-semibold text-gray-500">Nom — Entreprise</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <ImagePlaceholder label="Photo d'équipe ou de bureau (optionnel)" ratio="aspect-square" />
          </Reveal>
          <Reveal delay={100}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Notre mission</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">Redonner aux PME ouest-africaines le contrôle de leur gestion</h2>
            <p className="text-gray-600 mt-5 leading-relaxed">FactureFlow est né d'un constat simple : la facturation conforme ne devrait pas demander des compétences comptables. Notre objectif est de donner aux commerçants, artisans et indépendants de la zone UEMOA — d'Abidjan à Dakar — un outil aussi simple qu'un message, et aussi rigoureux qu'un expert-comptable.</p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24 bg-[#FFF7ED]">
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-10"><p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Questions fréquentes</p><h2 className="text-3xl font-extrabold tracking-tight mt-3">Avant de vous lancer</h2></Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="border border-orange-100 rounded-xl overflow-hidden bg-white">
                <button className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  {f.q}<ChevronDown size={16} className={`transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180 text-[var(--color-primary-600)]" : ""}`} />
                </button>
                <div className="px-5 text-sm text-gray-600 leading-relaxed transition-all duration-300 overflow-hidden" style={{ maxHeight: openFaq === i ? "160px" : "0px", paddingBottom: openFaq === i ? "16px" : "0px" }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-20">
        <Reveal className="max-w-4xl mx-auto text-center rounded-3xl px-8 py-16 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }}>
          <div className="anim-blob absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="anim-blob absolute -top-16 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: "4s" }} />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white relative tracking-tight">Votre prochaine facture, en moins d'une minute.</h2>
          <p className="text-orange-50 mt-4 relative">Aucune carte bancaire requise pour commencer.</p>
          <a href="#" className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-[var(--color-primary-700)] bg-white hover:bg-orange-50 px-7 py-3.5 rounded-lg transition-transform hover:scale-105 relative">Créer mon compte gratuit <ArrowRight size={16} /></a>
        </Reveal>
      </section>

      {/* CTA FLOTTANT */}
      {showFloatCta && (
        <a href="#" className="anim-popin fixed bottom-6 right-6 z-40 flex items-center gap-2 text-sm font-semibold text-white px-5 py-3.5 rounded-full shadow-2xl shadow-orange-500/40 hover:scale-105 transition-transform" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }}>
          <Sparkles size={16} /> Essai gratuit <ArrowRight size={15} />
        </a>
      )}

      {/* FOOTER */}
      <footer className="px-6 py-16 border-t border-gray-200">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(145deg,#FDBA74,var(--color-primary-600))" }}><span className="text-white text-[10px] font-extrabold">FF</span></div><span className="font-bold">FactureFlow</span></div>
            <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> Basée à Abidjan · Zone UEMOA</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Headphones size={12} /> Support en français</p>
          </div>
          {[
            { h: "Modules", links: ["Facturation & FNE", "Paiements", "Clients & Devis", "Automatisation & IA"] },
            { h: "Produit", links: ["Tarifs", "Sécurité", "Nouveautés"] },
            { h: "Entreprise", links: ["À propos", "Contact", "Blog"] },
            { h: "Légal", links: ["Conditions d'utilisation", "Confidentialité", "Conformité FNE"] },
          ].map((col) => (
            <div key={col.h}><p className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-3">{col.h}</p><ul className="space-y-2">{col.links.map((l) => <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-gray-900">{l}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-gray-100 text-xs text-gray-400">© 2026 FactureFlow Africa. Tous droits réservés.</div>
      </footer>
    </div>
  );
}
