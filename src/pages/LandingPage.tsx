import React, { useEffect, useRef, useState } from "react";
import {
  FileText, Users, Package, CreditCard, TrendingUp, Bell, Zap, Sparkles,
  CheckCircle2, QrCode, BarChart3, Wallet, Repeat, ClipboardList,
  ShieldCheck, ArrowRight, Menu, X, ChevronDown, Smartphone, Clock,
  Star, Mail, Check, MapPin, HeartHandshake, Lock, Headphones, Quote, Image as ImageIcon,
} from "lucide-react";

/* ===========================================================
   Charte graphique FactureFlow Africa — l'orange est LA couleur.
   #F97316 (marque, CTA, dégradés) · #C2410C (hover / profondeur)
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
  style?: React.CSSProperties;
}
function Reveal({ children, delay = 0, className = "", style = {} }: RevealProps) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity .8s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

/* ---------------- Zone réservée à une vraie image (à alimenter via le dashboard CMS) ---------------- */
interface ImagePlaceholderProps { label?: string; ratio?: string; className?: string; dark?: boolean; }
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

type IconType = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

interface HexaProps { icon: IconType; size?: number; tone?: string; reactToGroupHover?: boolean; }
function Hexa({ icon: Icon, size = 56, tone = "1", reactToGroupHover = false }: HexaProps) {
  const tones = {
    1: "linear-gradient(145deg,#FDBA74,#F97316)",
    2: "linear-gradient(145deg,#FB923C,#C2410C)",
    3: "linear-gradient(145deg,#FED7AA,#F97316)",
  };
  return (
    <div
      className={`flex items-center justify-center shrink-0 transition-transform duration-500 ease-out ${reactToGroupHover ? "group-hover:scale-110 group-hover:-rotate-3" : ""}`}
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

/* ---------------- Badge carré à "double" animé (fond qui se détache en fondu, façon carte qui respire) ---------------- */
interface PeelBadgeProps { icon: IconType; size?: number; tone?: string; floatDelay?: number; hover?: boolean; }
function PeelBadge({ icon: Icon, size = 72, tone = "1", floatDelay = 0, hover = false }: PeelBadgeProps) {
  const tones = {
    1: "linear-gradient(145deg,#FDBA74,#F97316)",
    2: "linear-gradient(145deg,#FB923C,#C2410C)",
    3: "linear-gradient(145deg,#FED7AA,#F97316)",
  };
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Copie fantôme qui se détache en fondu vers l'arrière */}
      <div
        className="absolute inset-0 rounded-2xl anim-peel"
        style={{ background: tones[tone], animationDelay: `${floatDelay}ms` }}
      />
      {/* Carré principal avec l'icône */}
      <div
        className="absolute inset-0 rounded-2xl flex items-center justify-center transition-transform duration-500 ease-out"
        style={{
          background: tones[tone],
          boxShadow: "0 14px 30px -8px rgba(249,115,22,0.55)",
          transform: hover ? "scale(1.08) rotate(-4deg)" : "scale(1) rotate(0deg)",
        }}
      >
        <Icon size={size * 0.42} className="text-white" strokeWidth={2} />
      </div>
    </div>
  );
}

/* ---------------- Carte "Pourquoi FactureFlow" avec survol géré en état React (fiable même hors CDN Tailwind) ---------------- */
interface WhySection { icon: IconType; tone: string; title: string; points: string[]; }
function WhyCard({ s, i }: { s: WhySection; i: number }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`grid md:grid-cols-[auto_1fr] gap-8 items-start rounded-3xl p-8 border transition-all duration-500 ease-out cursor-default ${i % 2 ? "md:[&>*:first-child]:order-2 md:[&>*:first-child]:justify-self-end" : ""}`}
      style={{
        background: hover ? "#0F172A" : "#FFFFFF",
        borderColor: hover ? "#0F172A" : "#FFEDD5",
        transform: hover ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hover
          ? "0 30px 70px -25px rgba(15,23,42,0.55)"
          : "0 20px 60px -30px rgba(249,115,22,0.35)",
      }}
    >
      <PeelBadge icon={s.icon} tone={s.tone} size={72} floatDelay={i * 300} hover={hover} />
      <div>
        <h3
          className="text-xl sm:text-2xl font-extrabold tracking-tight transition-colors duration-500"
          style={{ color: hover ? "#FFFFFF" : "#0F172A" }}
        >
          {s.title}
        </h3>
        <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {s.points.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2.5 text-sm transition-colors duration-500"
              style={{ color: hover ? "#F3F4F6" : "#374151" }}
            >
              <Check size={16} className="text-[#F97316] mt-0.5 shrink-0" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Flèche qui traverse le bouton du point A (gauche) au point B (droite), en boucle ---------------- */
function TravelArrow({ size = 18, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <span
      className="anim-travel-arrow absolute top-1/2"
      style={{ marginTop: -size / 2 }}
    >
      <ArrowRight size={size} style={{ color }} strokeWidth={2.4} />
    </span>
  );
}

/* ---------------- Carte ville avec animation de survol (soulèvement + remplissage coloré, façon carte "tarot") ---------------- */
function CityCard({ city, pays }: { city: string; pays: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="rounded-2xl border px-4 py-5 transition-all duration-300 ease-out cursor-default"
      style={{
        background: hover ? "linear-gradient(160deg,#FB923C,#C2410C)" : "#FFF7ED",
        borderColor: hover ? "#EA580C" : "#FFEDD5",
        transform: hover ? "translateY(-6px) scale(1.04)" : "translateY(0) scale(1)",
        boxShadow: hover ? "0 20px 40px -14px rgba(234,88,12,0.55)" : "none",
      }}
    >
      <div
        className="w-9 h-9 rounded-full mx-auto flex items-center justify-center mb-2 transition-transform duration-300"
        style={{
          background: hover ? "#FFFFFF" : "linear-gradient(145deg,#FDBA74,#F97316)",
          transform: hover ? "scale(1.1) rotate(-8deg)" : "scale(1) rotate(0deg)",
        }}
      >
        <MapPin size={16} style={{ color: hover ? "#EA580C" : "#FFFFFF" }} />
      </div>
      <p className="text-sm font-bold transition-colors duration-300" style={{ color: hover ? "#FFFFFF" : "#111827" }}>
        {city}
      </p>
      <p className="text-[11px] transition-colors duration-300" style={{ color: hover ? "rgba(255,255,255,0.85)" : "#6B7280" }}>
        {pays}
      </p>
    </div>
  );
}

function BeforeAfterBlock({ before, after }: { before: string; after: string }) {
  const [hoverBefore, setHoverBefore] = useState(false);
  const [hoverAfter, setHoverAfter] = useState(false);
  return (
    <div className="mt-6 flex items-stretch gap-3 rounded-xl border border-gray-200 overflow-hidden">
      <div
        onMouseEnter={() => setHoverBefore(true)}
        onMouseLeave={() => setHoverBefore(false)}
        className="flex-1 p-3.5 transition-all duration-300 ease-out cursor-default"
        style={{
          background: hoverBefore ? "#E5E7EB" : "#F9FAFB",
          transform: hoverBefore ? "scale(0.98)" : "scale(1)",
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Avant</p>
        <p className="text-[13px] transition-colors duration-300" style={{ color: hoverBefore ? "#6B7280" : "#9CA3AF" }}>
          {before}
        </p>
      </div>
      <div
        onMouseEnter={() => setHoverAfter(true)}
        onMouseLeave={() => setHoverAfter(false)}
        className="flex-1 p-3.5 border-l border-orange-100 transition-all duration-300 ease-out cursor-default relative"
        style={{
          background: hoverAfter ? "linear-gradient(135deg,#FB923C,#EA580C)" : "#FFF7ED",
          transform: hoverAfter ? "scale(1.02)" : "scale(1)",
          boxShadow: hoverAfter ? "0 12px 28px -10px rgba(249,115,22,0.55)" : "none",
          zIndex: hoverAfter ? 1 : 0,
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1.5 transition-colors duration-300"
          style={{ color: hoverAfter ? "#FFFFFF" : "#C2410C" }}
        >
          Avec FactureFlow
        </p>
        <p className="text-[13px] font-medium transition-colors duration-300" style={{ color: hoverAfter ? "#FFFFFF" : "#374151" }}>
          {after}
        </p>
      </div>
    </div>
  );
}

interface SweepButtonProps {
  as?: "a" | "button";
  href?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  fillColor?: string;
  children: React.ReactNode | ((hover: boolean) => React.ReactNode);
}
function SweepButton({ as: Tag = "a", href = "#", onClick, className = "", style, fillColor, children }: SweepButtonProps) {
  const [hover, setHover] = useState(false);
  const Component = Tag as any;
  return (
    <Component
      href={Tag === "a" ? href : undefined}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          background: fillColor,
          transformOrigin: "right center",
          transform: hover ? "scaleX(1)" : "scaleX(0)",
        }}
      />
      <span className="relative z-10">{typeof children === "function" ? children(hover) : children}</span>
    </Component>
  );
}


/* ---------------- Sceau à bords ondulés (façon tampon/sticker) ---------------- */
function ScallopedSeal({ size = 72, color = "#22C55E", petals = 13, children }: { size?: number; color?: string; petals?: number; children?: React.ReactNode }) {
  const petalSize = size * 0.32;
  const radius = size * 0.5 - petalSize * 0.42;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (360 / petals) * i;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: petalSize,
              height: petalSize,
              background: color,
              top: "50%",
              left: "50%",
              transform: `translate(-50%,-50%) rotate(${angle}deg) translateX(${radius}px)`,
            }}
          />
        );
      })}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: size * 0.1,
          background: color,
          boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.85)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

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

/* ---------------- Mockups par module (CSS — pas de dépendance à une image externe) ---------------- */
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
                <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === "Payé" ? "bg-green-100 text-green-700" : "bg-orange-100 text-[#C2410C]"}`}>{r.status}</span></td>
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
              <div className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: "linear-gradient(145deg,#FB923C,#C2410C)" }}>{c.i}</div>
              <span className="text-[13px] font-medium text-gray-800">{c.n}</span>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-mono text-gray-900">{c.solde}</p>
              <p className={`text-[10px] font-semibold ${c.tag === "À jour" ? "text-green-600" : "text-[#C2410C]"}`}>{c.tag}</p>
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
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.v}%`, background: "linear-gradient(90deg,#FDBA74,#F97316)" }} /></div>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between text-[13px] font-semibold"><span className="text-gray-700">Marge nette estimée</span><span className="text-[#C2410C]">62%</span></div>
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
  const tagColor: Record<string, string> = { "Stock faible": "bg-orange-100 text-[#C2410C]", "Rupture": "bg-red-100 text-red-600", "En stock": "bg-green-100 text-green-700" };
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
  const tagColor: Record<string, string> = { "Reçue": "bg-green-100 text-green-700", "En cours": "bg-blue-100 text-blue-600", "En attente": "bg-orange-100 text-[#C2410C]" };
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
    { m: "Décaissements", v: 48, c: "#F97316" },
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
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C2410C] uppercase tracking-wide"><Sparkles size={13} /> Suggestions IA</div>
        {[
          { c: "Établissements Koné", p: "82%", msg: "Relancer aujourd'hui par SMS" },
          { c: "SARL Diallo & Fils", p: "54%", msg: "Proposer un échéancier" },
        ].map((r) => (
          <div key={r.c} className="border border-orange-100 bg-orange-50/60 rounded-lg px-3 py-2.5">
            <div className="flex justify-between text-[13px] font-medium text-gray-800"><span>{r.c}</span><span className="text-[#C2410C] font-mono text-[12px]">{r.p}</span></div>
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
              <div className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: "linear-gradient(145deg,#FDBA74,#C2410C)" }}>{t.i}</div>
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
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={i === 0 ? { background: "linear-gradient(145deg,#FDBA74,#F97316)" } : { background: "rgba(255,255,255,0.1)" }}><Icon size={14} className="text-white" /></div>
            ))}
          </div>
          <div className="flex-1 p-5 bg-[#F9FAFB]">
            <div className="grid grid-cols-3 gap-3">
              {[{ l: "Encaissé ce mois", v: "1 240 000 F", c: "text-gray-900" }, { l: "En attente", v: "380 000 F", c: "text-[#C2410C]" }, { l: "Factures FNE", v: "42", c: "text-green-600" }].map((k) => (
                <div key={k.l} className="bg-white rounded-lg border border-gray-200 p-3"><p className="text-[10px] text-gray-400">{k.l}</p><p className={`text-sm font-bold mt-1 ${k.c}`}>{k.v}</p></div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 mt-3 p-4 flex items-end gap-2 h-24">
              {bars.map((h, i) => <div key={i} className="flex-1 rounded-t-sm transition-all duration-700 ease-out" style={{ height: `${h}%`, background: "linear-gradient(180deg,#FDBA74,#F97316)" }} />)}
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
          <span className="px-3 py-1.5 rounded-lg bg-[#F97316]/10 text-[#C2410C] font-semibold flex items-center gap-1"><Mail size={12} /> Email de relance</span>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest">Assistant IA</p>
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-[12px] text-gray-600 mb-2">« Quel client me doit le plus ? »</div>
          <div className="bg-[#F97316]/10 rounded-lg px-3 py-2 text-[12px] text-[#C2410C] font-medium">Établissements Koné — 480 000 F, échue depuis 12 jours.</div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------- Données ---------------- */
const tabs = [
  { key: "facturer", label: "Facturation", icon: FileText, title: "Des factures certifiées FNE, prêtes en un clic", text: "Choisissez un client et vos articles : la facture se met en forme, se numérote et reçoit son QR code de certification automatiquement.",
    groups: [
      { title: "Création & envoi", items: ["Modèles PDF personnalisables (logo, couleurs)", "Facturation récurrente pour vos abonnements", "Devis transformés en facture en un clic", "Envoi par email ou lien direct au client"] },
      { title: "Conformité", items: ["QR code FNE apposé automatiquement", "Numérotation continue et sécurisée", "Mentions légales toujours à jour", "Historique conservé pour vos obligations fiscales"] },
    ], stat: { value: "< 60s", label: "pour émettre une facture certifiée FNE" }, before: "Word/Excel, mise en forme manuelle", after: "Modèle + QR code générés automatiquement", mock: <InvoiceMock /> },
  { key: "stock", label: "Stock", icon: Package, badge: "Nouveau", title: "Ne soyez plus jamais pris au dépourvu", text: "Suivez vos niveaux de stock en temps réel et repérez en un coup d'œil les articles en rupture ou à réapprovisionner.",
    groups: [
      { title: "Suivi en temps réel", items: ["Niveaux actualisés à chaque vente ou achat", "Alertes automatiques de stock faible", "Valorisation du stock en continu"] },
      { title: "Traçabilité", items: ["Historique des mouvements par article", "Lien automatique avec achats et ventes", "Vue par entrepôt (multi-dépôts)"] },
    ], stat: { value: "Temps réel", label: "niveaux de stock toujours à jour" }, before: "Cahier ou tableur mis à jour à la main", after: "Mise à jour automatique à chaque vente/achat", mock: <StockMock /> },
  { key: "achats", label: "Achats", icon: ClipboardList, badge: "Nouveau", title: "Vos commandes fournisseurs, centralisées", text: "Suivez chaque commande, de son émission à sa réception, et gardez une vision claire de vos engagements financiers.",
    groups: [
      { title: "Commandes fournisseurs", items: ["Suivi du statut de chaque commande", "Réception liée automatiquement au stock", "Historique complet par fournisseur"] },
      { title: "Contrôle financier", items: ["Rapprochement automatique avec les dépenses", "Alertes sur commandes en retard", "Vue consolidée des engagements en cours"] },
    ], stat: { value: "100%", label: "des commandes tracées, de la demande à la réception" }, before: "Bons de commande papier ou WhatsApp", after: "Suivi centralisé et lié au stock", mock: <AchatsMock /> },
  { key: "encaisser", label: "Paiements", icon: CreditCard, title: "Suivez chaque encaissement, quel que soit le canal", text: "Orange Money, MTN MoMo, Wave, virement ou espèces : le statut de la facture se met à jour dès que le règlement est enregistré.",
    groups: [
      { title: "Encaissement", items: ["Compatible Orange Money, MTN MoMo, Wave", "Suivi virement et espèces", "Statuts automatiques : envoyée, en retard, payée"] },
      { title: "Suivi", items: ["Historique complet par facture", "Relances programmées sans intervention", "Export des règlements pour rapprochement"] },
    ], stat: { value: "3", label: "opérateurs Mobile Money pris en charge" }, before: "Vérification manuelle des paiements reçus", after: "Statut de facture mis à jour automatiquement", mock: <PaymentsMock /> },
  { key: "tresorerie", label: "Trésorerie", icon: TrendingUp, badge: "Nouveau", title: "Vos comptes et votre trésorerie, sous contrôle", text: "Regroupez vos comptes bancaires et Mobile Money, et anticipez vos besoins de trésorerie à 30 jours.",
    groups: [
      { title: "Vue consolidée", items: ["Comptes bancaires et Mobile Money regroupés", "Solde en temps réel par compte"] },
      { title: "Anticipation", items: ["Prévisionnel de trésorerie à 30 jours", "Alertes en cas de solde critique", "Rapprochement bancaire simplifié"] },
    ], stat: { value: "30 jours", label: "de prévisionnel de trésorerie" }, before: "Solde connu seulement au relevé bancaire", after: "Vue consolidée et anticipation en continu", mock: <TresorerieMock /> },
  { key: "recouvrement", label: "Recouvrement IA", icon: ShieldCheck, badge: "IA", title: "L'IA identifie qui relancer, et comment", text: "L'assistant analyse l'historique de paiement de chaque client et vous recommande la meilleure action de recouvrement.",
    groups: [
      { title: "Analyse prédictive", items: ["Score de probabilité de paiement par client", "Priorisation automatique des impayés"] },
      { title: "Action", items: ["Recommandation du canal de relance le plus efficace", "Suivi de l'efficacité des relances passées"] },
    ], stat: { value: "Score IA", label: "par client, mis à jour en continu" }, before: "Relances au feeling, sans priorisation", after: "L'IA indique qui relancer, et comment", mock: <RecouvrementMock /> },
  { key: "clients", label: "Clients", icon: Users, title: "Une vue claire sur chaque client", text: "Coordonnées, solde, historique de facturation : tout est centralisé pour préparer un rendez-vous ou relancer en confiance.",
    groups: [
      { title: "Fiche client", items: ["Coordonnées, solde et historique centralisés", "Recherche instantanée avant chaque facture"] },
      { title: "Segmentation", items: ["Par statut de paiement", "Par volume d'affaires", "Devis illimités liés à chaque client"] },
    ], stat: { value: "Illimité", label: "clients et historiques centralisés" }, before: "Contacts éparpillés (téléphone, carnets)", after: "Fiche unique avec solde et historique", mock: <ClientsMock /> },
  { key: "rh", label: "Ressources humaines", icon: Users, badge: "Nouveau", title: "Votre équipe, gérée depuis le même outil", text: "Centralisez les fiches de votre personnel, leurs rôles et leur statut, sans jongler avec un fichier séparé.",
    groups: [
      { title: "Gestion d'équipe", items: ["Fiches employés et rôles d'accès", "Suivi des statuts (actif, congé)"] },
      { title: "Lien financier", items: ["Lien avec les dépenses de personnel", "Historique par collaborateur"] },
    ], stat: { value: "Multi-rôles", label: "gestion d'équipe sans fichier séparé" }, before: "Fiches employés dans des fichiers isolés", after: "Équipe et rôles gérés dans le même outil", mock: <RHMock /> },
  { key: "depenses", label: "Dépenses", icon: Wallet, title: "Connaissez votre marge réelle, pas seulement votre CA", text: "Classez vos charges par catégorie et comparez-les à vos encaissements pour piloter la rentabilité, pas seulement le chiffre d'affaires.",
    groups: [
      { title: "Classement", items: ["Dépenses classées par catégorie", "Rapprochement avec les achats"] },
      { title: "Analyse", items: ["Calcul automatique de la marge nette", "Comparatif mois par mois", "Export pour votre comptable"] },
    ], stat: { value: "Marge nette", label: "calculée automatiquement" }, before: "Chiffre d'affaires suivi, marge devinée", after: "Dépenses et revenus rapprochés en continu", mock: <DepensesMock /> },
  { key: "piloter", label: "Pilotage", icon: BarChart3, title: "Votre activité, lisible en un coup d'œil", text: "Le dashboard agrège ventes, encaissements et échéances en temps réel. Les rapports s'exportent en un clic pour votre comptable.",
    groups: [
      { title: "Tableau de bord", items: ["Indicateurs de trésorerie en direct", "Vue consolidée multi-entreprises"] },
      { title: "Rapports", items: ["Export PDF ou tableur en un clic", "Historique par client et par produit", "Comparatif de performance mois par mois"] },
    ], stat: { value: "Temps réel", label: "vue consolidée de votre activité" }, before: "Chiffres reconstitués en fin de mois", after: "Dashboard à jour à chaque instant", mock: <DashboardMock /> },
  { key: "automatiser", label: "Automatisation & IA", icon: Sparkles, badge: "Nouveau", title: "Ce qui travaille pendant que vous êtes sur le terrain", text: "Définissez une règle une seule fois — relance, tâche, notification — et laissez FactureFlow l'exécuter. L'assistant IA répond en français, à partir de vos données réelles.",
    groups: [
      { title: "Règles automatiques", items: ["6 déclencheurs disponibles", "3 types d'actions (email, tâche, notification)", "Vérification périodique automatique"] },
      { title: "Assistant IA", items: ["Réponses en langage naturel", "Basé sur vos données réelles", "Disponible à tout moment dans le dashboard"] },
    ], stat: { value: "6 déclencheurs", label: "+ assistant IA en français" }, before: "Relances et suivis faits manuellement", after: "Règles automatiques + réponses IA instantanées", mock: <AutomationMock /> },
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
  { name: "Gratuit", monthly: 0, yearly: 0, tag: null, trial: true, badge: "14 jours, sans carte bancaire", points: ["Accès complet aux fonctionnalités Starter", "Facturation & devis illimités pendant l'essai", "Certification FNE automatique", "Stock, Paiements & Dépenses", "1 utilisateur", "Accès désactivé après 14 jours sans abonnement"] },
  { name: "Starter", monthly: 4990, yearly: 43900, tag: null, points: ["Factures & devis illimités", "Certification FNE automatique", "Module Stock inclus", "Paiements & suivi Mobile Money", "Dépenses & rapports de base", "Facturation récurrente", "3 utilisateurs", "PDF sans marque FactureFlow", "Support email (48h)"] },
  { name: "Pro", monthly: 8900, yearly: 87800, tag: "Le plus choisi", points: [
      "Tout Starter, plus :",
      "Achats fournisseurs et rapprochement automatique",
      "Comptes & Trésorerie consolidés",
      "Prévisionnel de trésorerie à 30 jours",
      "Recouvrement IA (scoring et priorisation)",
      "Automatisation illimitée (règles et déclencheurs)",
      "Assistant IA illimité en langage naturel",
      "Ressources humaines jusqu'à 10 employés",
      "Rapports avancés exportables (PDF / tableur)",
      "Jusqu'à 10 utilisateurs",
      "Support prioritaire (réponse sous 24h)",
    ] },
  { name: "Business", monthly: 15000, yearly: 159000, tag: null, points: [
      "Tout Pro, plus :",
      "Multi-entreprises illimité",
      "RH illimité (aucune limite d'employés)",
      "Rôles & permissions avancés par module",
      "Tableau de bord consolidé multi-entreprises",
      "Export comptable multi-structures",
      "Utilisateurs illimités",
      "Accompagnement dédié à la mise en place",
      "Formation de l'équipe incluse",
      "Support SLA prioritaire (réponse sous 4h)",
      "Gestionnaire de compte dédié",
      "Accès anticipé aux nouvelles fonctionnalités",
      "Personnalisation de la facturation (logo, mentions)",
      "API & Webhooks (déploiement en cours)",
    ] },
];

const faqs = [
  { q: "Mes factures sont-elles conformes à la réglementation ivoirienne ?", a: "Oui. Chaque facture générée sur FactureFlow intègre le QR code de certification FNE requis par la DGI, sans démarche supplémentaire de votre part." },
  { q: "Puis-je encaisser via Mobile Money ?", a: "Le suivi des paiements couvre Orange Money, MTN MoMo, Wave, virement et espèces : le statut de la facture se met à jour automatiquement dès que le règlement est enregistré." },
  { q: "Est-ce adapté si je ne suis pas à l'aise avec l'informatique ?", a: "L'interface est pensée pour être utilisable dès la première connexion : créer une facture ne demande pas plus d'étapes que rédiger un message." },
  { q: "Comment fonctionne l'assistant IA ?", a: "Posez une question en français sur votre activité — clients, échéances, chiffre d'affaires — et l'assistant répond à partir de vos données réelles, directement dans le dashboard." },
  { q: "Puis-je essayer avant de m'engager ?", a: "Oui, vous bénéficiez de 14 jours d'essai gratuit avec un accès complet aux fonctionnalités du plan Starter, sans carte bancaire. Passé ce délai, un abonnement est nécessaire pour continuer à utiliser FactureFlow." },
  { q: "Que se passe-t-il si j'arrête mon abonnement ?", a: "Vos données restent exportables à tout moment. Aucune facture ni aucun client n'est verrouillé sur la plateforme." },
  { q: "Puis-je gérer plusieurs entreprises depuis un seul compte ?", a: "Oui, l'offre Business permet de piloter plusieurs structures depuis une interface unique." },
  { q: "FactureFlow est-il disponible dans mon pays ?", a: "FactureFlow est utilisable dans les 8 pays de la zone UEMOA, avec facturation en FCFA. La certification FNE, spécifique à la réglementation ivoirienne, est disponible pour la Côte d'Ivoire ; les équivalents pour les autres pays sont ajoutés progressivement." },
];

/* ---------------- App ---------------- */
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.65)", animation: "fadeIn .3s ease" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl rounded-3xl overflow-hidden grid md:grid-cols-2 shadow-2xl anim-popin" style={{ background: "linear-gradient(135deg,#1C1917,#0F172A)" }}>
        <button onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <X size={16} />
        </button>

        {/* Visuel : tablette montrant le dashboard */}
        <div className="relative flex items-center justify-center p-8 md:p-10 overflow-hidden">
          <div className="anim-blob absolute w-64 h-64 rounded-full bg-[#F97316]/30 blur-3xl" />
          <div className="relative w-full max-w-[240px] rounded-[24px] p-1.5 shadow-2xl" style={{ aspectRatio: "3/4", background: "#111827" }}>
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-600" />
            <div className="w-full h-full rounded-[18px] overflow-hidden bg-[#F9FAFB] p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-md" style={{ background: "linear-gradient(145deg,#FDBA74,#F97316)" }} />
                <span className="font-bold text-gray-800 text-[8px]">FactureFlow</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-white rounded-md border border-gray-200 p-1.5"><p className="text-gray-400 text-[6px]">Encaissé</p><p className="font-bold text-gray-900 text-[8px]">1 240 000 F</p></div>
                <div className="bg-white rounded-md border border-gray-200 p-1.5"><p className="text-gray-400 text-[6px]">Factures FNE</p><p className="font-bold text-green-600 text-[8px]">42</p></div>
              </div>
              <div className="bg-white rounded-md border border-gray-200 p-1.5 flex items-end gap-1 h-10">
                {[40, 65, 50, 80, 60].map((h, i) => <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: "linear-gradient(180deg,#FDBA74,#F97316)" }} />)}
              </div>
              <div className="bg-white rounded-md border border-gray-200 p-1.5 space-y-1 flex-1">
                {[{ n: "Koné", s: "bg-green-500" }, { n: "Diallo & Fils", s: "bg-[#F97316]" }].map((r) => (
                  <div key={r.n} className="flex items-center justify-between text-[7px] text-gray-600"><span>{r.n}</span><span className={`w-1 h-1 rounded-full ${r.s}`} /></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Texte + CTA */}
        <div className="p-8 md:p-10 flex flex-col justify-center relative">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Bienvenue sur FactureFlow</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">Pilotez toute votre entreprise en 2 minutes</h3>
          <p className="text-gray-400 mt-3 text-sm leading-relaxed">Facturation certifiée FNE, stock, trésorerie, RH et automatisation — testez gratuitement, sans carte bancaire.</p>
          <a href="#tarifs" onClick={onClose} className="inline-flex items-center justify-center gap-2 mt-6 text-sm font-semibold text-white px-6 py-3.5 rounded-full transition-transform hover:scale-105 w-fit" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)", boxShadow: "0 10px 30px -8px rgba(249,115,22,0.6)" }}>
            Essai gratuit <ArrowRight size={16} />
          </a>
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300 mt-4 text-left transition-colors">Non merci, plus tard</button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [annual, setAnnual] = useState(true);
  const [showFloatCta, setShowFloatCta] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(true), 1500);
    return () => clearTimeout(t);
  }, []);

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
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-mono-ff { font-family: 'IBM Plex Mono', monospace; }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(0.4deg); } }
        @keyframes blob { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(25px,-18px) scale(1.06); } 66% { transform: translate(-18px,12px) scale(0.96); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.45); } 50% { box-shadow: 0 0 0 14px rgba(249,115,22,0); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform: translateY(0);} }
        @keyframes slideFade { from { opacity:0; transform: translateX(14px);} to { opacity:1; transform: translateX(0);} }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes popIn { from { opacity:0; transform: scale(0.7) translateY(10px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes peelGhost {
          0%, 100% { transform: translate(0,0) rotate(0deg); opacity: 0; }
          50% { transform: translate(-15px,15px) rotate(-9deg); opacity: 0.55; }
        }
        .anim-peel { animation: peelGhost 2.6s ease-in-out infinite; }
        @keyframes travelArrow {
          0%, 100% { left: 18px; opacity: 0; }
          12% { opacity: 1; }
          46%, 58% { left: calc(100% - 34px); opacity: 1; }
          88% { opacity: 0; }
        }
        .anim-travel-arrow { animation: travelArrow 2.4s ease-in-out infinite; }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-blob { animation: blob 15s ease-in-out infinite; }
        .anim-pulse { animation: pulseGlow 2.4s ease-in-out infinite; }
        .anim-marquee { animation: marquee 22s linear infinite; }
        .anim-popin { animation: popIn 0.4s cubic-bezier(.34,1.56,.64,1); }
        @media (prefers-reduced-motion: reduce) { .anim-float,.anim-blob,.anim-pulse,.anim-marquee,.anim-peel,.anim-travel-arrow { animation: none !important; } * { transition-duration: .01ms !important; } }
      `}</style>

      {/* NAV */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm" : "bg-transparent"}`}>
        <div className="hidden sm:flex items-center justify-center gap-2 text-[12px] font-semibold text-white py-1.5" style={{ background: "linear-gradient(90deg,#EA580C,#F97316,#EA580C)" }}>
          <Sparkles size={12} /> Disponible dans les 8 pays de la zone UEMOA — même plateforme, même FCFA
        </div>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/30" style={{ background: "linear-gradient(145deg,#FDBA74,#F97316)" }}><span className="text-white text-xs font-extrabold">FF</span></div>
            <span className="text-lg font-bold tracking-tight">FactureFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">{navLinks.map((l) => <a key={l.label} href={l.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.label}</a>)}</nav>
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-sm font-semibold text-gray-600 hover:text-gray-900">Connexion</a>
            <SweepButton href="#" className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-transform hover:scale-105" style={{ background: "linear-gradient(135deg,#FB923C,#F97316)" }} fillColor="#C2410C">
              Essai gratuit
            </SweepButton>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-3">
            {navLinks.map((l) => <a key={l.label} href={l.href} className="block text-sm text-gray-700">{l.label}</a>)}
            <SweepButton href="#" className="block text-sm font-semibold text-white bg-[#F97316] px-4 py-2 rounded-lg text-center" fillColor="#C2410C">
              Essai gratuit
            </SweepButton>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-36 sm:pt-40 pb-0 px-6" style={{ backgroundImage: `${dotGrid}`, backgroundSize: "22px 22px", backgroundPosition: "-11px -11px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white pointer-events-none" style={{ maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)" }} />
        <div className="anim-blob absolute -top-24 -left-20 w-[30rem] h-[30rem] rounded-full bg-[#F97316]/15 blur-3xl" />
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
                <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#F97316,#EA580C)" }}>nouvelle génération</span>
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
                <li key={b} className="flex items-center gap-2.5 text-sm text-gray-700"><Check size={16} className="text-[#F97316] shrink-0" /> {b}</li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <SweepButton href="#" className="anim-pulse inline-flex items-center gap-2 text-sm font-semibold text-white px-7 py-3.5 rounded-lg transition-transform hover:scale-105" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }} fillColor="#C2410C">
                <span className="flex items-center gap-2">S'inscrire gratuitement <ArrowRight size={16} /></span>
              </SweepButton>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#F97316]" /> Conforme DGI</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#F97316]" /> 8 pays UEMOA</span>
              <span className="flex items-center gap-1.5"><Headphones size={14} className="text-[#F97316]" /> Support en français</span>
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
                {[{ n: "Koné", s: "bg-green-500" }, { n: "Diallo & Fils", s: "bg-[#F97316]" }, { n: "Traoré Design", s: "bg-green-500" }].map((r) => (
                  <div key={r.n} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
                    <span className="text-[11px] text-gray-600 font-medium">{r.n}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.s}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Badges flottants */}
            <div className="hidden lg:flex absolute top-0 left-6 items-center gap-2 bg-white rounded-xl shadow-2xl shadow-orange-500/20 px-3.5 py-2.5 border border-orange-100 anim-float">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" /><span className="text-[11px] font-semibold text-gray-700">En retard</span>
            </div>
            <div className="hidden lg:flex absolute bottom-24 right-0 items-center gap-2 bg-white rounded-xl shadow-2xl shadow-orange-500/20 px-3.5 py-2.5 border border-orange-100 anim-float" style={{ animationDelay: "1.2s" }}>
              <CheckCircle2 size={14} className="text-green-600" /><span className="text-[11px] font-semibold text-gray-700">À jour</span>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 bg-white rounded-xl shadow-2xl shadow-orange-500/25 px-4 py-3 border border-orange-100 anim-float" style={{ animationDelay: "2s" }}>
              <QrCode size={22} className="text-[#F97316]" />
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
                <b.icon size={18} className="text-[#F97316] shrink-0" />
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
            <span key={i} className="flex items-center gap-2 mx-6 text-sm font-semibold text-[#C2410C] whitespace-nowrap">
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
                <CityCard city={c.city} pays={c.pays} />
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
        <div className="anim-blob absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#F97316]/20 blur-3xl" />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white relative">
          {[{ v: 16, s: "", l: "Modules ERP intégrés" }, { v: 3, s: "", l: "Opérateurs Mobile Money" }, { v: 100, s: "%", l: "Conforme FNE / DGI" }, { v: 60, s: "s", l: "Pour créer une facture" }].map((s) => (
            <div key={s.l}>
              <p className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#FDBA74,#F97316)" }}><Counter value={s.v} suffix={s.s} /></p>
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
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : t.badge === "IA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-[#C2410C]"}`}>{t.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div key={activeTab} className="grid md:grid-cols-2 gap-14 items-center" style={{ animation: "slideFade .45s cubic-bezier(.16,1,.3,1)" }}>
            <div>{tabs[activeTab].mock}</div>
            <div>
              <Hexa icon={tabs[activeTab].icon} size={52} tone="1" />
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-4">{tabs[activeTab].title}</h3>
              <p className="text-gray-600 mt-4 leading-relaxed">{tabs[activeTab].text}</p>

              <div className="inline-flex items-baseline gap-2 mt-5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5">
                <span className="text-xl font-extrabold text-[#F97316]">{tabs[activeTab].stat.value}</span>
                <span className="text-xs text-gray-500">{tabs[activeTab].stat.label}</span>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {tabs[activeTab].groups.map((g) => (
                  <div key={g.title}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">{g.title}</p>
                    <ul className="space-y-2.5">
                      {g.items.map((b) => <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700 transition-colors hover:text-gray-900"><CheckCircle2 size={16} className="text-[#F97316] mt-0.5 shrink-0" /> {b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <BeforeAfterBlock before={tabs[activeTab].before} after={tabs[activeTab].after} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTIONS CHECK-LIST ALTERNÉES avec hexagones — cartes animées au survol (fond → gris foncé, texte → blanc) */}
      <section id="pourquoi" className="px-6 py-24 bg-[#FFF7ED] relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative">
          <Reveal className="max-w-xl mx-auto text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Pourquoi FactureFlow</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Concentrez-vous sur votre activité, on s'occupe du reste</h2>
          </Reveal>
          <div className="space-y-14">
            {whySections.map((s, i) => (
              <Reveal key={s.title}>
                <WhyCard s={s} i={i} />
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
                  <span className="inline-block bg-gray-900 text-white px-4 py-1.5 rounded-full text-xl sm:text-2xl mt-2">Gratuite 14 jours pour démarrer</span>
                </h3>
                <p className="text-orange-50 mt-5 max-w-md">FactureFlow est une solution complète — facturation certifiée FNE, stock, achats, trésorerie, RH — à essayer 14 jours sans frais cachés et sans carte bancaire.</p>
                <SweepButton href="#" className="inline-flex items-center gap-2 mt-7 text-sm font-semibold bg-white px-6 py-3 rounded-lg transition-colors" fillColor="linear-gradient(135deg,#FB923C,#EA580C)">
                  {(hover) => (
                    <span className="transition-colors duration-500" style={{ color: hover ? "#FFFFFF" : "#C2410C" }}>
                      S'équiper sans engagement
                    </span>
                  )}
                </SweepButton>
              </div>
              <div className="relative flex items-center">
                <ImagePlaceholder label="Visuel produit (capture d'écran ou illustration à ajouter)" ratio="aspect-[4/3]" className="w-full" dark />
                <div className="absolute -bottom-4 -right-4 drop-shadow-xl">
                  <ScallopedSeal size={76} color="#22C55E">
                    <span className="text-white text-[9px] font-extrabold text-center leading-tight">100%<br />FNE</span>
                  </ScallopedSeal>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="text-center mt-20 mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Passez sur la <span className="inline-block bg-orange-100 text-[#C2410C] px-3 py-1 rounded-full">suite ERP</span> FactureFlow
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
              <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!annual ? "bg-gray-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}>Mensuel</button>
              <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${annual ? "bg-gray-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}>Annuel <span className="text-red-500 font-bold">Économisez</span></button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Prix en FCFA — facturation annuelle en un seul paiement</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mt-10">
            {plans.map((p, i) => {
              const price = annual ? p.yearly : p.monthly;
              const monthlyEquivalent = annual && !p.trial ? Math.round(p.yearly / 12) : null;
              const savingsPct = !p.trial && p.monthly ? Math.round(((p.monthly * 12 - p.yearly) / (p.monthly * 12)) * 100) : null;
              return (
                <Reveal key={p.name} delay={i * 90}>
                  <div className={`rounded-2xl p-6 h-full text-left flex flex-col relative ${p.tag ? "text-white shadow-2xl scale-[1.05]" : "border border-gray-200 bg-white"}`} style={p.tag ? { background: "linear-gradient(180deg,#1F2937,#0F172A)" } : {}}>
                    {p.tag && (
                      <span
                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7C2D12] px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg"
                        style={{ background: "linear-gradient(135deg,#FDBA74,#F97316)", boxShadow: "0 8px 20px -6px rgba(249,115,22,0.65)" }}
                      >
                        <Star size={12} className="fill-[#7C2D12]" /> {p.tag}
                      </span>
                    )}
                    <p className={`font-bold ${p.tag ? "text-white" : "text-gray-900"} ${p.tag ? "mt-2" : ""}`}>{p.name}</p>
                    {p.badge && (
                      <span className="inline-block w-fit text-[10px] font-bold text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-full mt-1.5">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-2xl font-extrabold mt-2">
                      {p.trial ? "14 jours" : `${fmt(price)} F`}
                      {!p.trial && <span className={`text-xs font-medium ${p.tag ? "text-white/70" : "text-gray-400"}`}>{annual ? "/an" : "/mois"}</span>}
                    </p>
                    {annual && monthlyEquivalent && (
                      <p className={`text-[11px] mt-0.5 ${p.tag ? "text-white/60" : "text-gray-400"}`}>
                        soit {fmt(monthlyEquivalent)} F/mois {savingsPct ? <span className="text-green-500 font-semibold">· -{savingsPct}%</span> : null}
                      </p>
                    )}
                    <ul className="mt-5 space-y-2.5 flex-1">
                      {p.points.map((pt) => <li key={pt} className={`text-[13px] flex items-start gap-2 ${p.tag ? "text-white/90" : "text-gray-600"}`}><Check size={14} className={`mt-0.5 shrink-0 ${p.tag ? "text-white" : "text-[#F97316]"}`} /> {pt}</li>)}
                    </ul>
                    <SweepButton
                      href="#"
                      className={`block mt-6 text-sm font-semibold text-center py-2.5 rounded-lg transition-colors ${p.tag ? "bg-white" : "bg-gray-100"}`}
                      fillColor={p.tag ? "linear-gradient(135deg,#FB923C,#EA580C)" : "linear-gradient(135deg,#FB923C,#EA580C)"}
                    >
                      {(hover) => (
                        <span
                          className="transition-colors duration-500"
                          style={{ color: hover ? "#FFFFFF" : p.tag ? "#C2410C" : "#374151" }}
                        >
                          Choisir
                        </span>
                      )}
                    </SweepButton>
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
      <section id="faq" className="px-6 py-24 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#EA580C]">Questions fréquentes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Avant de vous lancer</h2>
            <p className="text-gray-500 mt-3">Tout ce qu'il faut savoir sur la conformité, les paiements et l'abonnement.</p>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.q} delay={i * 40}>
                  <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${open ? "bg-gray-900 shadow-xl" : "bg-gray-50 hover:bg-gray-100"}`}>
                    <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setOpenFaq(open ? -1 : i)}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-colors ${open ? "bg-[#F97316] text-white" : "bg-white text-[#F97316] border border-orange-200"}`}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={`flex-1 text-sm font-semibold transition-colors ${open ? "text-white" : "text-gray-800"}`}>{f.q}</span>
                      <ChevronDown size={18} className={`transition-transform shrink-0 ${open ? "rotate-180 text-[#F97316]" : "text-gray-400"}`} />
                    </button>
                    <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? "200px" : "0px" }}>
                      <p className="px-5 pb-5 pl-[60px] text-sm text-gray-300 leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={300} className="text-center mt-10">
            <p className="text-sm text-gray-500">Une autre question ? <a href="#" className="font-semibold text-[#F97316] hover:underline">Contactez notre support</a></p>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-20">
        <Reveal className="max-w-4xl mx-auto text-center rounded-3xl px-8 py-16 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }}>
          <div className="anim-blob absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="anim-blob absolute -top-16 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: "4s" }} />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white relative tracking-tight">Votre prochaine facture, en moins d'une minute.</h2>
          <p className="text-orange-50 mt-4 relative">14 jours d'essai gratuit — Aucune carte bancaire requise</p>
          <SweepButton href="#" className="inline-flex items-center gap-2 mt-8 text-sm font-semibold bg-white px-7 py-3.5 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.45)]" fillColor="#1C1917">
            {(hover) => (
              <span className="flex items-center gap-2 transition-colors duration-500" style={{ color: hover ? "#FFFFFF" : "#C2410C" }}>
                Créer mon compte gratuit
                <ArrowRight size={16} className="transition-transform duration-500" style={{ transform: hover ? "translateX(6px)" : "translateX(0)" }} />
              </span>
            )}
          </SweepButton>
        </Reveal>
      </section>

      {/* CTA FLOTTANT */}
      {showFloatCta && (
        <a href="#" className="anim-popin fixed bottom-6 right-6 z-40 overflow-hidden flex items-center text-sm font-semibold text-white pl-5 pr-11 py-3.5 rounded-full shadow-2xl shadow-orange-500/40 hover:scale-105 transition-transform" style={{ background: "linear-gradient(135deg,#FB923C,#EA580C)" }}>
          Essai gratuit
          <TravelArrow size={18} color="#FFFFFF" />
        </a>
      )}

      {/* FOOTER */}
      <footer className="px-6 py-16 bg-gray-900">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(145deg,#FDBA74,#F97316)" }}><span className="text-white text-[10px] font-extrabold">FF</span></div><span className="font-bold text-white">FactureFlow</span></div>
            <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> Basée à Abidjan · Zone UEMOA</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Headphones size={12} /> Support en français</p>
          </div>
          {[
            { h: "Modules", links: ["Facturation & FNE", "Paiements", "Clients & Devis", "Automatisation & IA"] },
            { h: "Produit", links: ["Tarifs", "Sécurité", "Nouveautés"] },
            { h: "Entreprise", links: ["À propos", "Contact", "Blog"] },
            { h: "Légal", links: ["Conditions d'utilisation", "Confidentialité", "Conformité FNE"] },
          ].map((col) => (
            <div key={col.h}><p className="text-xs font-semibold text-white uppercase tracking-widest mb-3">{col.h}</p><ul className="space-y-2">{col.links.map((l) => <li key={l}><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 text-xs text-gray-500">© 2026 FactureFlow Africa. Tous droits réservés.</div>
      </footer>
    </div>
  );
}

