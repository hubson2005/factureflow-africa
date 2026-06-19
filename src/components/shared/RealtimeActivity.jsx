// RealtimeActivity.jsx
// Composant : Activité en temps réel — écoute Supabase live
// npm install @supabase/supabase-js

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ─── CSS ─────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#111215;--card:#1a1c21;--border:rgba(255,255,255,0.07);
  --hover:#22252c;--hover2:#2a2d35;
  --orange:#f5841f;--orangeD:rgba(245,132,31,0.12);
  --green:#22d07a;--blue:#4d9cf8;--red:#f45b5b;--yellow:#fbbf24;
  --t1:#f0f0f0;--t2:#9fa3b0;--t3:#5c6070;
}

.ra-root{
  background:var(--card);border:1px solid var(--border);
  border-radius:16px;padding:18px;
  font-family:'DM Sans',sans-serif;color:var(--t1);
  display:flex;flex-direction:column;gap:0;
}

/* ── Header ── */
.ra-hdr{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:14px;
}
.ra-title{
  font-family:'Syne',sans-serif;font-size:15px;font-weight:700;
  display:flex;align-items:center;gap:9px;
}
.ra-live{
  display:flex;align-items:center;gap:5px;
  font-size:10.5px;font-weight:600;color:var(--green);
  background:rgba(34,208,122,.1);
  border:1px solid rgba(34,208,122,.2);
  border-radius:20px;padding:2px 8px;
}
.ra-live-dot{
  width:6px;height:6px;border-radius:50%;
  background:var(--green);
  animation:blink 1.5s ease-in-out infinite;
}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}

.ra-voir-tout{
  font-size:12.5px;font-weight:600;color:var(--t1);
  background:var(--hover);border:1px solid var(--border);
  border-radius:9px;padding:5px 13px;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:all .12s;
}
.ra-voir-tout:hover{background:var(--hover2)}

/* ── Items ── */
.ra-list{display:flex;flex-direction:column;gap:0}

.ra-item{
  display:flex;align-items:center;gap:12px;
  padding:10px 0;
  border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .12s;cursor:default;
  border-radius:0;
  animation:slideIn .3s ease;
}
.ra-item:last-child{border-bottom:none}
.ra-item:hover{
  background:var(--hover);
  margin:0 -8px;padding:10px 8px;
  border-radius:9px;border-color:transparent;
}
.ra-item.new-item{
  background:rgba(245,132,31,.06);
  animation:newItem .4s ease;
}
@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes newItem{
  0%{background:rgba(245,132,31,.2)}
  100%{background:rgba(245,132,31,.06)}
}

/* Icône */
.ra-ico{
  width:36px;height:36px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  font-size:17px;flex-shrink:0;
}

/* Texte */
.ra-body{flex:1;min-width:0}
.ra-event{
  font-size:13px;font-weight:500;
  line-height:1.4;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.ra-event-full{white-space:normal}
.ra-sub{font-size:11px;color:var(--t2);margin-top:1px}

/* Temps */
.ra-time{
  font-size:11.5px;color:var(--t3);
  flex-shrink:0;white-space:nowrap;
}

/* ── Vide ── */
.ra-empty{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;padding:28px 0;gap:8px;
  color:var(--t3);font-size:13px;
}

/* ── Voir tout modal ── */
.modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.65);
  backdrop-filter:blur(5px);z-index:100;
  display:flex;align-items:center;justify-content:center;padding:20px;
}
.modal{
  background:var(--card);border:1px solid var(--border);
  border-radius:18px;width:100%;max-width:540px;
  padding:22px;display:flex;flex-direction:column;gap:14px;
  animation:slideUp .2s ease;max-height:80vh;
}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.modal-hdr{
  display:flex;align-items:center;justify-content:space-between;
}
.modal-title{
  font-family:'Syne',sans-serif;font-size:16px;font-weight:700;
  display:flex;align-items:center;gap:8px;
}
.modal-close{
  background:none;border:none;color:var(--t2);
  font-size:20px;cursor:pointer;line-height:1;padding:0;
  transition:color .12s;
}
.modal-close:hover{color:var(--t1)}
.modal-list{overflow-y:auto;display:flex;flex-direction:column;gap:0;flex:1}

/* ── Filtres ── */
.ra-filters{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.rf{
  padding:4px 11px;border-radius:7px;font-size:11.5px;cursor:pointer;
  border:1px solid var(--border);background:var(--hover);
  color:var(--t2);font-family:'DM Sans',sans-serif;transition:all .12s;
}
.rf:hover{background:var(--hover2);color:var(--t1)}
.rf.on{background:var(--orangeD);border-color:rgba(245,132,31,.3);color:var(--orange);font-weight:600}

/* Skeleton */
.sk{background:rgba(255,255,255,.06);border-radius:7px;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
`;

/* ─── Config des types d'événements ─────────────────────────── */
const EVENT_CONFIG = {
  lead: {
    icon: "🧲",
    bg:   "rgba(245,132,31,.12)",
    color:"#f5841f",
    label: (e) => e.label || "Nouveau lead",
  },
  form: {
    icon: "📋",
    bg:   "rgba(77,156,248,.12)",
    color:"#4d9cf8",
    label: (e) => e.label || "Formulaire soumis",
  },
  visit: {
    icon: "👁",
    bg:   "rgba(100,100,180,.12)",
    color:"#8b9cf8",
    label: (e) => e.label || "Visite",
  },
  whatsapp: {
    icon: "💬",
    bg:   "rgba(37,211,102,.12)",
    color:"#25d366",
    label: (e) => e.label || "Clic WhatsApp",
  },
  click: {
    icon: "👆",
    bg:   "rgba(245,132,31,.1)",
    color:"#f5841f",
    label: (e) => e.label || "Clic",
  },
  scan: {
    icon: "📷",
    bg:   "rgba(167,139,250,.12)",
    color:"#a78bfa",
    label: (e) => e.label || "Scan QR Code",
  },
  download: {
    icon: "⬇",
    bg:   "rgba(34,208,122,.1)",
    color:"#22d07a",
    label: (e) => e.label || "Téléchargement",
  },
};

const getConfig = (type) =>
  EVENT_CONFIG[type] || {
    icon: "⚡", bg: "rgba(100,100,120,.15)", color: "#9fa3b0",
    label: (e) => e.label || type,
  };

/* ─── Données de démo ────────────────────────────────────────── */
const DEMO_EVENTS = [
  { id:1, type:"form",     label:"Nouveau lead depuis le formulaire Contact",     sublabel:"Formulaire Contact", time_ago:"il y a 2 min",  created_at: Date.now()-120000 },
  { id:2, type:"visit",    label:"Visite depuis Côte d'Ivoire",                   sublabel:"Abidjan, CI",        time_ago:"il y a 5 min",  created_at: Date.now()-300000 },
  { id:3, type:"whatsapp", label:"Clic sur WhatsApp",                             sublabel:"Profil public",      time_ago:"il y a 8 min",  created_at: Date.now()-480000 },
  { id:4, type:"form",     label:"Nouveau lead depuis le formulaire Réservation", sublabel:"Formulaire Résa",    time_ago:"il y a 12 min", created_at: Date.now()-720000 },
  { id:5, type:"visit",    label:"Visite depuis France",                          sublabel:"Paris, FR",          time_ago:"il y a 15 min", created_at: Date.now()-900000 },
  { id:6, type:"scan",     label:"Scan QR Code — Plateau, Abidjan",               sublabel:"QR Code principal",  time_ago:"il y a 22 min", created_at: Date.now()-1320000 },
  { id:7, type:"lead",     label:"Nouveau lead — Konan Alphonse",                 sublabel:"WhatsApp",           time_ago:"il y a 28 min", created_at: Date.now()-1680000 },
  { id:8, type:"download", label:"PDF téléchargé — Brochure services",            sublabel:"Document #2",        time_ago:"il y a 35 min", created_at: Date.now()-2100000 },
  { id:9, type:"click",    label:"Clic sur lien Instagram",                       sublabel:"Bio link",           time_ago:"il y a 42 min", created_at: Date.now()-2520000 },
  {id:10, type:"visit",    label:"Visite depuis Bénin",                           sublabel:"Cotonou, BJ",        time_ago:"il y a 1h",     created_at: Date.now()-3600000 },
];

const FILTERS = [
  { id:"all",      label:"Tout" },
  { id:"lead",     label:"Leads" },
  { id:"form",     label:"Formulaires" },
  { id:"visit",    label:"Visites" },
  { id:"whatsapp", label:"WhatsApp" },
  { id:"scan",     label:"QR Code" },
];

/* ─── Hook : formatage du temps relatif ─────────────────────── */
function useRelativeTime(ts) {
  const [rel, setRel] = useState("");
  useEffect(()=>{
    const fmt = () => {
      const diff = Math.floor((Date.now()-ts)/1000);
      if(diff<60)  return "à l'instant";
      if(diff<3600)return `il y a ${Math.floor(diff/60)} min`;
      if(diff<86400)return `il y a ${Math.floor(diff/3600)}h`;
      return `il y a ${Math.floor(diff/86400)}j`;
    };
    setRel(fmt());
    const id = setInterval(()=>setRel(fmt()), 30000);
    return ()=>clearInterval(id);
  },[ts]);
  return rel;
}

/* ─── Composant item ─────────────────────────────────────────── */
function ActivityItem({ event, isNew=false, fullText=false }) {
  const cfg  = getConfig(event.type);
  const time = useRelativeTime(event.created_at || Date.now());

  return (
    <div className={`ra-item${isNew?" new-item":""}`}>
      <div className="ra-ico" style={{background:cfg.bg}}>
        {cfg.icon}
      </div>
      <div className="ra-body">
        <div className={`ra-event${fullText?" ra-event-full":""}`}>
          {cfg.label(event)}
        </div>
        {event.sublabel && (
          <div className="ra-sub">{event.sublabel}</div>
        )}
      </div>
      <div className="ra-time">{event.time_ago || time}</div>
    </div>
  );
}

/* ─── Composant principal ────────────────────────────────────── */
export default function RealtimeActivity({ maxVisible = 5 }) {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIds,  setNewIds]  = useState(new Set());
  const [showAll, setShowAll] = useState(false);
  const [filter,  setFilter]  = useState("all");
  const [count,   setCount]   = useState(0);
  const channelRef = useRef(null);

  /* Chargement initial */
  useEffect(()=>{
    const load = async () => {
      try {
        const { data } = await supabase
          .from("realtime_events")
          .select("*")
          .order("created_at",{ascending:false})
          .limit(50);

        if(data && data.length>0){
          setEvents(data.map(d=>({...d,created_at:new Date(d.created_at).getTime()})));
          setCount(data.length);
        } else {
          setEvents(DEMO_EVENTS);
          setCount(DEMO_EVENTS.length);
        }
      } catch {
        setEvents(DEMO_EVENTS);
        setCount(DEMO_EVENTS.length);
      }
      setLoading(false);
    };
    load();
  },[]);

  /* Supabase Realtime — écoute INSERT sur realtime_events */
  useEffect(()=>{
    channelRef.current = supabase
      .channel("ra-events")
      .on("postgres_changes",
        { event:"INSERT", schema:"public", table:"realtime_events" },
        (payload) => {
          const newEvt = {
            ...payload.new,
            created_at: new Date(payload.new.created_at).getTime(),
            time_ago: "à l'instant",
          };
          const newId = newEvt.id || Date.now();

          setEvents(prev=>[newEvt, ...prev].slice(0,50));
          setCount(c=>c+1);
          setNewIds(s=>{
            const ns = new Set(s);
            ns.add(newId);
            setTimeout(()=>{
              setNewIds(ss=>{ const cs=new Set(ss); cs.delete(newId); return cs; });
            }, 3000);
            return ns;
          });
        }
      )
      .subscribe();

    return ()=>{
      if(channelRef.current) supabase.removeChannel(channelRef.current);
    };
  },[]);

  /* Filtrage */
  const filtered = events.filter(e=>
    filter==="all" || e.type===filter
  );
  const visible  = filtered.slice(0, maxVisible);

  return (
    <>
      <style>{STYLE}</style>
      <div className="ra-root">

        {/* ── Header ── */}
        <div className="ra-hdr">
          <div className="ra-title">
            Activité en temps réel
            <span className="ra-live">
              <span className="ra-live-dot"/>
              Live
            </span>
          </div>
          <button className="ra-voir-tout" onClick={()=>setShowAll(true)}>
            Voir tout
          </button>
        </div>

        {/* ── Liste ── */}
        <div className="ra-list">
          {loading
            ? Array(maxVisible).fill(0).map((_,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                  <div className="sk" style={{width:36,height:36,borderRadius:10}}/>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                    <div className="sk" style={{height:13,width:"75%"}}/>
                    <div className="sk" style={{height:10,width:"40%"}}/>
                  </div>
                  <div className="sk" style={{width:60,height:12}}/>
                </div>
              ))
            : visible.length > 0
              ? visible.map(evt=>(
                  <ActivityItem
                    key={evt.id || evt.created_at}
                    event={evt}
                    isNew={newIds.has(evt.id)}
                  />
                ))
              : (
                <div className="ra-empty">
                  <span style={{fontSize:26}}>⚡</span>
                  Aucune activité pour le moment
                </div>
              )
          }
        </div>

        {/* Compteur si plus d'items */}
        {!loading && filtered.length > maxVisible && (
          <div style={{
            textAlign:"center",marginTop:10,paddingTop:10,
            borderTop:"1px solid rgba(255,255,255,.05)",
            fontSize:12,color:"#5c6070",cursor:"pointer",
          }} onClick={()=>setShowAll(true)}>
            +{filtered.length-maxVisible} autres événements →
          </div>
        )}

      </div>

      {/* ── Modal Voir tout ── */}
      {showAll && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAll(false)}>
          <div className="modal">
            <div className="modal-hdr">
              <div className="modal-title">
                ⚡ Activité en temps réel
                <span className="ra-live">
                  <span className="ra-live-dot"/>
                  {count} événements
                </span>
              </div>
              <button className="modal-close" onClick={()=>setShowAll(false)}>✕</button>
            </div>

            {/* Filtres */}
            <div className="ra-filters">
              {FILTERS.map(f=>(
                <button key={f.id} className={`rf${filter===f.id?" on":""}`}
                  onClick={()=>setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste complète */}
            <div className="modal-list">
              {filtered.map(evt=>(
                <ActivityItem
                  key={evt.id || evt.created_at}
                  event={evt}
                  isNew={newIds.has(evt.id)}
                  fullText
                />
              ))}
              {filtered.length===0 && (
                <div className="ra-empty">
                  <span style={{fontSize:26}}>🔍</span>
                  Aucun événement dans cette catégorie
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}