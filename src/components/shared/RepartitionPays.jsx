// RepartitionPays.jsx
// Composant : Répartition par pays — Carte monde + Tableau
// npm install @supabase/supabase-js

import { useState, useEffect, useCallback, useRef } from "react";
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
  --purple:#7c3aed;--purpleL:#9b6dff;
  --green:#22d07a;--blue:#4d9cf8;
  --t1:#f0f0f0;--t2:#9fa3b0;--t3:#5c6070;
}

.rp-wrap{
  background:var(--card);border:1px solid var(--border);
  border-radius:16px;padding:18px;
  font-family:'DM Sans',sans-serif;color:var(--t1);
  display:flex;flex-direction:column;gap:14px;
}

/* ── Header ── */
.rp-hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.rp-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700}
.rp-hdr-right{display:flex;align-items:center;gap:7px}

/* ── Periode ── */
.rp-period{position:relative}
.rp-period-btn{
  display:flex;align-items:center;gap:6px;
  background:var(--hover);border:1px solid var(--border);
  border-radius:9px;padding:5px 11px;
  font-size:12px;color:var(--t2);cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:all .12s;white-space:nowrap;
}
.rp-period-btn:hover{background:var(--hover2);color:var(--t1)}
.rp-dropdown{
  position:absolute;top:calc(100% + 5px);right:0;
  background:var(--card);border:1px solid var(--border);
  border-radius:10px;padding:4px;min-width:155px;
  z-index:50;box-shadow:0 8px 24px rgba(0,0,0,.4);
  animation:fadeIn .15s ease;
}
@keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
.rp-opt{padding:7px 11px;border-radius:7px;font-size:12px;cursor:pointer;color:var(--t2);transition:all .12s}
.rp-opt:hover{background:var(--hover);color:var(--t1)}
.rp-opt.on{background:var(--orangeD);color:var(--orange);font-weight:600}

/* ── Metric tabs ── */
.rp-metrics{display:flex;gap:5px}
.rp-mtab{
  padding:4px 11px;border-radius:7px;font-size:11.5px;cursor:pointer;
  border:1px solid var(--border);background:var(--hover);
  color:var(--t2);font-family:'DM Sans',sans-serif;transition:all .12s;
}
.rp-mtab:hover{background:var(--hover2);color:var(--t1)}
.rp-mtab.on{background:var(--orangeD);border-color:rgba(245,132,31,.3);color:var(--orange);font-weight:600}

/* ── Carte monde SVG ── */
.rp-map{
  width:100%;border-radius:10px;overflow:hidden;
  background:linear-gradient(160deg,#0a0d1a 0%,#0f1128 60%,#080b16 100%);
  position:relative;
}
.rp-map svg{width:100%;height:auto;display:block}

/* Tooltip carte */
.map-tooltip{
  position:absolute;background:var(--card);
  border:1px solid var(--border);border-radius:9px;
  padding:8px 12px;font-size:12px;pointer-events:none;
  box-shadow:0 4px 16px rgba(0,0,0,.5);
  white-space:nowrap;z-index:10;
  transition:opacity .15s;
}
.map-tooltip-name{font-weight:600;color:var(--t1)}
.map-tooltip-val{color:var(--orange);font-weight:700;margin-top:2px}
.map-tooltip-pct{color:var(--t2);font-size:11px}

/* ── Tableau ── */
.rp-table{display:flex;flex-direction:column;gap:0}

.rp-table-hdr{
  display:flex;align-items:center;gap:8px;
  padding:0 0 7px;
  border-bottom:1px solid var(--border);
  font-size:10.5px;font-weight:700;
  letter-spacing:.5px;text-transform:uppercase;color:var(--t3);
}

.rp-row{
  display:flex;align-items:center;gap:8px;
  padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);
  cursor:pointer;transition:background .12s;
  border-radius:0;
}
.rp-row:hover{background:var(--hover);margin:0 -8px;padding:9px 8px;border-radius:9px}
.rp-row:last-child{border-bottom:none}
.rp-row.highlighted{
  background:var(--orangeD);
  margin:0 -8px;padding:9px 8px;border-radius:9px;
  border-color:transparent;
}

.rp-flag{font-size:18px;flex-shrink:0;width:24px;text-align:center}
.rp-country{flex:1;font-size:13px;font-weight:500}
.rp-bar-wrap{flex:1;max-width:90px}
.rp-bar-bg{height:4px;background:var(--hover);border-radius:2px;overflow:hidden}
.rp-bar-fill{height:100%;border-radius:2px;transition:width .5s ease;background:linear-gradient(90deg,var(--purple),var(--purpleL))}
.rp-bar-fill.top{background:linear-gradient(90deg,var(--orange),#ffb347)}
.rp-count{font-size:13px;font-weight:700;min-width:50px;text-align:right}
.rp-pct{font-size:12px;color:var(--t2);min-width:42px;text-align:right}
.rp-rank{font-size:11px;font-weight:700;min-width:18px;text-align:center;color:var(--t3)}
.rp-rank.r1{color:var(--orange)}

/* Autres row */
.rp-autres{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 0;margin-top:4px;
  border-top:1px solid var(--border);
  font-size:12.5px;color:var(--t2);
}
.rp-autres-val{font-weight:700;color:var(--t1)}

/* ── Total ── */
.rp-total{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 12px;
  background:var(--hover);border:1px solid var(--border);
  border-radius:10px;
}
.rp-total-lbl{font-size:12px;color:var(--t2)}
.rp-total-val{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--orange)}
.rp-total-delta{font-size:11px;color:var(--green);font-weight:600}

/* ── Skeleton ── */
.sk{background:rgba(255,255,255,.06);border-radius:7px;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
`;

/* ─── Données pays ──────────────────────────────────────────── */
const COUNTRIES_DATA = {
  "7d": [
    { name:"Côte d'Ivoire", flag:"🇨🇮", iso:"CI", count:1250, pct:29.7, lat:7.5,  lng:-5.5,  cx:220, cy:195 },
    { name:"France",        flag:"🇫🇷", iso:"FR", count:620,  pct:14.7, lat:46.2, lng:2.2,   cx:258, cy:110 },
    { name:"United States", flag:"🇺🇸", iso:"US", count:510,  pct:12.1, lat:37.1, lng:-95.7, cx:100, cy:130 },
    { name:"Bénin",         flag:"🇧🇯", iso:"BJ", count:410,  pct:9.7,  lat:9.3,  lng:2.3,   cx:242, cy:190 },
    { name:"Canada",        flag:"🇨🇦", iso:"CA", count:310,  pct:7.4,  lat:56.1, lng:-106,  cx:95,  cy:95  },
  ],
  "30d": [
    { name:"Côte d'Ivoire", flag:"🇨🇮", iso:"CI", count:5100, pct:31.2, cx:220, cy:195 },
    { name:"France",        flag:"🇫🇷", iso:"FR", count:2400, pct:14.7, cx:258, cy:110 },
    { name:"United States", flag:"🇺🇸", iso:"US", count:2050, pct:12.5, cx:100, cy:130 },
    { name:"Bénin",         flag:"🇧🇯", iso:"BJ", count:1650, pct:10.1, cx:242, cy:190 },
    { name:"Canada",        flag:"🇨🇦", iso:"CA", count:1250, pct:7.6,  cx:95,  cy:95  },
  ],
  "90d": [
    { name:"Côte d'Ivoire", flag:"🇨🇮", iso:"CI", count:15800, pct:30.5, cx:220, cy:195 },
    { name:"France",        flag:"🇫🇷", iso:"FR", count:7500,  pct:14.5, cx:258, cy:110 },
    { name:"United States", flag:"🇺🇸", iso:"US", count:6200,  pct:12.0, cx:100, cy:130 },
    { name:"Bénin",         flag:"🇧🇯", iso:"BJ", count:5100,  pct:9.8,  cx:242, cy:190 },
    { name:"Canada",        flag:"🇨🇦", iso:"CA", count:3850,  pct:7.4,  cx:95,  cy:95  },
  ],
};
COUNTRIES_DATA["14d"] = COUNTRIES_DATA["7d"].map(c=>({...c,count:c.count*2}));
COUNTRIES_DATA["365d"]= COUNTRIES_DATA["90d"].map(c=>({...c,count:c.count*4}));

const AUTRES_DATA = { "7d":1110, "14d":2220, "30d":4550, "90d":13950, "365d":55800 };
const AUTRES_PCT  = { "7d":26.4,"14d":26.4,"30d":27.9,"90d":26.9,"365d":27.0 };

const PERIODS = [
  {id:"7d",label:"7 derniers jours"},
  {id:"14d",label:"14 derniers jours"},
  {id:"30d",label:"30 derniers jours"},
  {id:"90d",label:"3 derniers mois"},
  {id:"365d",label:"Cette année"},
];

const METRICS = [{id:"views",label:"Vues"},{id:"leads",label:"Leads"},{id:"clicks",label:"Clics"}];

/* ─── Carte monde SVG ──────────────────────────────────────── */
function WorldMap({ countries, highlighted, onHover }) {
  return (
    <svg viewBox="0 0 500 260" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow-ci" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5841f" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#f5841f" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="glow-fr" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9b6dff" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#9b6dff" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="glow-us" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4d9cf8" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#4d9cf8" stopOpacity="0"/>
        </radialGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>

      {/* Fond océan */}
      <rect width="500" height="260" fill="#080c1a" rx="10"/>

      {/* Grille méridiens/parallèles */}
      {[30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,480].map(x=>(
        <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="rgba(255,255,255,.025)" strokeWidth=".5"/>
      ))}
      {[40,80,120,160,200].map(y=>(
        <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,.025)" strokeWidth=".5"/>
      ))}

      {/* ── Continents ── */}
      {/* Amérique du Nord */}
      <path d="M 30 60 Q 55 45 90 55 Q 115 50 140 60 Q 155 72 148 95 Q 140 115 125 125 Q 108 135 90 128 Q 72 120 58 108 Q 42 92 35 80 Z"
        fill="#1e2a4a" stroke="#2a3a60" strokeWidth=".8"/>
      {/* Mexique / Amérique Centrale */}
      <path d="M 100 128 Q 120 130 132 140 Q 138 152 130 162 Q 120 170 108 165 Q 96 158 92 145 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".6"/>
      {/* Amérique du Sud */}
      <path d="M 110 175 Q 135 168 155 178 Q 170 190 168 215 Q 162 240 145 252 Q 125 258 110 248 Q 95 236 90 215 Q 88 196 110 175 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".8"/>

      {/* Europe */}
      <path d="M 230 68 Q 255 58 280 65 Q 298 72 302 85 Q 300 98 285 105 Q 268 110 250 106 Q 232 100 226 88 Z"
        fill="#2a3a6a" stroke="#3a4a80" strokeWidth=".8"/>
      {/* Scandinavie */}
      <path d="M 248 45 Q 265 35 278 42 Q 285 55 270 65 Q 255 62 248 52 Z"
        fill="#243060" stroke="#3a4a80" strokeWidth=".5"/>
      {/* Péninsule ibérique */}
      <path d="M 226 88 Q 238 95 235 108 Q 228 115 218 112 Q 210 105 214 95 Z"
        fill="#2a3a6a" stroke="#3a4a80" strokeWidth=".5"/>

      {/* Afrique du Nord */}
      <path d="M 220 112 Q 260 108 298 115 Q 318 122 320 140 Q 318 155 300 160 Q 278 163 258 158 Q 238 152 225 140 Q 215 128 220 112 Z"
        fill="#1e2a4a" stroke="#2a3a60" strokeWidth=".8"/>
      {/* Afrique subsaharienne (dont CI) */}
      <path d="M 210 162 Q 245 158 278 165 Q 298 174 302 195 Q 305 218 290 232 Q 272 242 250 240 Q 228 238 215 226 Q 200 210 200 190 Q 200 172 210 162 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".8"/>
      {/* Corne de l'Afrique */}
      <path d="M 302 175 Q 322 172 330 185 Q 325 198 315 200 Q 305 198 302 188 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".5"/>

      {/* Moyen-Orient */}
      <path d="M 300 105 Q 330 100 348 110 Q 358 122 350 135 Q 338 142 320 140 Q 305 135 300 122 Z"
        fill="#1e2a4a" stroke="#2a3a60" strokeWidth=".7"/>

      {/* Asie centrale + Russie */}
      <path d="M 290 40 Q 350 25 420 35 Q 455 42 468 58 Q 462 75 440 82 Q 408 88 375 82 Q 342 76 318 70 Q 298 62 290 50 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".8"/>
      {/* Sibérie */}
      <path d="M 355 18 Q 410 10 450 18 Q 465 28 458 40 Q 440 35 420 35 Q 390 32 365 28 Z"
        fill="#151f38" stroke="#2a3a60" strokeWidth=".5"/>

      {/* Asie du Sud / Inde */}
      <path d="M 345 108 Q 375 102 395 115 Q 405 130 398 148 Q 388 158 370 155 Q 352 148 345 135 Q 340 120 345 108 Z"
        fill="#1e2a4a" stroke="#2a3a60" strokeWidth=".7"/>

      {/* Asie du Sud-Est */}
      <path d="M 400 118 Q 425 112 445 122 Q 458 135 452 150 Q 440 158 422 155 Q 408 148 402 135 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".6"/>
      {/* Péninsule Indochine */}
      <path d="M 418 155 Q 432 158 438 170 Q 432 180 420 178 Q 412 170 415 160 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".5"/>

      {/* Chine / Japon */}
      <path d="M 392 68 Q 428 62 455 70 Q 468 80 462 94 Q 448 100 425 98 Q 400 94 392 82 Z"
        fill="#1e2a4a" stroke="#2a3a60" strokeWidth=".7"/>

      {/* Australie */}
      <path d="M 410 185 Q 445 178 465 192 Q 475 208 468 225 Q 455 238 435 235 Q 415 230 408 215 Q 404 200 410 185 Z"
        fill="#1a2540" stroke="#2a3a60" strokeWidth=".7"/>

      {/* ── Halos lumineux sur les pays top ── */}
      {/* Côte d'Ivoire */}
      <circle cx="220" cy="195" r="30" fill="url(#glow-ci)" filter="url(#blur)"/>
      {/* France */}
      <circle cx="255" cy="92"  r="20" fill="url(#glow-fr)" filter="url(#blur)"/>
      {/* USA */}
      <circle cx="90"  cy="100" r="22" fill="url(#glow-us)" filter="url(#blur)"/>

      {/* ── Points des pays ── */}
      {countries.map((c,i)=>{
        const isTop    = i===0;
        const isHover  = highlighted===c.iso;
        const color    = isTop ? "#f5841f" : i===1 ? "#9b6dff" : i===2 ? "#4d9cf8" : "#22d07a";
        const r        = isTop ? 6 : i<2 ? 5 : 4;
        return (
          <g key={c.iso} style={{cursor:"pointer"}}
            onMouseEnter={()=>onHover(c)}
            onMouseLeave={()=>onHover(null)}>
            {/* Halo */}
            <circle cx={c.cx} cy={c.cy} r={r+8} fill={color} opacity={isHover?".25":".1"}
              style={{transition:"r .2s,opacity .2s"}}/>
            {/* Point */}
            <circle cx={c.cx} cy={c.cy} r={isHover?r+2:r} fill={color} opacity=".95"
              style={{transition:"r .2s"}}/>
            {/* Anneau */}
            <circle cx={c.cx} cy={c.cy} r={r+3} fill="none" stroke={color}
              strokeWidth={isHover?"1.5":"1"} opacity={isHover?".6":".3"}
              style={{transition:"all .2s"}}/>
          </g>
        );
      })}

      {/* ── Lignes de connexion depuis CI ── */}
      {countries.slice(1).map((c,i)=>{
        const ci = countries[0];
        return (
          <line key={c.iso}
            x1={ci.cx} y1={ci.cy} x2={c.cx} y2={c.cy}
            stroke="rgba(245,132,31,.12)" strokeWidth="1"
            strokeDasharray="3 4"
          />
        );
      })}
    </svg>
  );
}

/* ─── Composant principal ────────────────────────────────────── */
export default function RepartitionPays() {
  const [period,     setPeriod]    = useState("7d");
  const [showDrop,   setShowDrop]  = useState(false);
  const [metric,     setMetric]    = useState("views");
  const [countries,  setCountries] = useState([]);
  const [autres,     setAutres]    = useState(0);
  const [autresPct,  setAutresPct] = useState(0);
  const [highlighted,setHighlighted]=useState(null);
  const [tooltip,    setTooltip]   = useState(null);
  const [tooltipPos, setTooltipPos]= useState({x:0,y:0});
  const [loading,    setLoading]   = useState(true);
  const mapRef = useRef(null);

  /* Chargement */
  const fetchData = useCallback(async()=>{
    setLoading(true);
    try {
      // Essai depuis Supabase (table: country_stats)
      const { data } = await supabase
        .from("country_stats")
        .select("name, flag, iso, count, pct, cx, cy")
        .order("count",{ascending:false})
        .limit(5);

      if(data && data.length>0){
        setCountries(data);
        const tot = data.reduce((s,c)=>s+c.count,0);
        const topTot = data.reduce((s,c)=>s+c.count*c.pct/100*tot,0);
        setAutres(Math.round(tot*0.264));
        setAutresPct(26.4);
      } else {
        setCountries(COUNTRIES_DATA[period]||COUNTRIES_DATA["7d"]);
        setAutres(AUTRES_DATA[period]||1110);
        setAutresPct(AUTRES_PCT[period]||26.4);
      }
    } catch {
      setCountries(COUNTRIES_DATA[period]||COUNTRIES_DATA["7d"]);
      setAutres(AUTRES_DATA[period]||1110);
      setAutresPct(AUTRES_PCT[period]||26.4);
    }
    setLoading(false);
  },[period]);

  useEffect(()=>{ fetchData(); },[fetchData]);

  const total = countries.reduce((s,c)=>s+c.count,0) + autres;
  const maxCount = Math.max(...countries.map(c=>c.count),1);

  const handleMapHover = (country) => {
    setHighlighted(country?.iso || null);
    setTooltip(country);
  };

  const handleMouseMove = (e) => {
    if(!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top  - 40,
    });
  };

  const selPeriod = PERIODS.find(p=>p.id===period);

  return (
    <>
      <style>{STYLE}</style>
      <div className="rp-wrap">

        {/* ── Header ── */}
        <div className="rp-hdr">
          <span className="rp-title">🌍 Répartition par pays</span>
          <div className="rp-hdr-right">

            {/* Metric */}
            <div className="rp-metrics">
              {METRICS.map(m=>(
                <button key={m.id} className={`rp-mtab${metric===m.id?" on":""}`}
                  onClick={()=>setMetric(m.id)}>{m.label}</button>
              ))}
            </div>

            {/* Période */}
            <div className="rp-period">
              <button className="rp-period-btn" onClick={()=>setShowDrop(v=>!v)}>
                {selPeriod?.label} ▾
              </button>
              {showDrop && (
                <div className="rp-dropdown">
                  {PERIODS.map(p=>(
                    <div key={p.id} className={`rp-opt${period===p.id?" on":""}`}
                      onClick={()=>{setPeriod(p.id);setShowDrop(false)}}>
                      {p.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="rp-period-btn" onClick={fetchData}>↻</button>
          </div>
        </div>

        {/* ── Carte monde ── */}
        <div className="rp-map" ref={mapRef} onMouseMove={handleMouseMove}>
          {loading
            ? <div className="sk" style={{height:160,borderRadius:10}}/>
            : <WorldMap countries={countries} highlighted={highlighted} onHover={handleMapHover}/>
          }
          {/* Tooltip carte */}
          {tooltip && (
            <div className="map-tooltip" style={{left:tooltipPos.x,top:tooltipPos.y}}>
              <div className="map-tooltip-name">{tooltip.flag} {tooltip.name}</div>
              <div className="map-tooltip-val">{tooltip.count?.toLocaleString("fr-FR")} {METRICS.find(m=>m.id===metric)?.label}</div>
              <div className="map-tooltip-pct">{tooltip.pct}% du total</div>
            </div>
          )}
        </div>

        {/* ── Légende couleurs ── */}
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {[["#f5841f","1er"],["#9b6dff","2e"],["#4d9cf8","3e"],["#22d07a","Autres"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9fa3b0"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
              {l}
            </div>
          ))}
        </div>

        {/* ── Tableau ── */}
        <div className="rp-table">
          <div className="rp-table-hdr">
            <span style={{width:18}}>#</span>
            <span style={{minWidth:24}}></span>
            <span style={{flex:1}}>Pays</span>
            <span style={{flex:1,maxWidth:90}}>Part</span>
            <span style={{minWidth:50,textAlign:"right"}}>Total</span>
            <span style={{minWidth:42,textAlign:"right"}}>%</span>
          </div>

          {loading
            ? Array(5).fill(0).map((_,i)=>(
                <div key={i} style={{padding:"9px 0",display:"flex",gap:10,alignItems:"center"}}>
                  <div className="sk" style={{width:18,height:16}}/>
                  <div className="sk" style={{width:24,height:24,borderRadius:"50%"}}/>
                  <div className="sk" style={{flex:1,height:14}}/>
                  <div className="sk" style={{width:50,height:14}}/>
                  <div className="sk" style={{width:42,height:14}}/>
                </div>
              ))
            : countries.map((c,i)=>(
                <div key={c.iso}
                  className={`rp-row${highlighted===c.iso?" highlighted":""}`}
                  onMouseEnter={()=>setHighlighted(c.iso)}
                  onMouseLeave={()=>setHighlighted(null)}>
                  <span className={`rp-rank${i===0?" r1":""}`}>{i+1}</span>
                  <span className="rp-flag">{c.flag}</span>
                  <span className="rp-country">{c.name}</span>
                  <div className="rp-bar-wrap">
                    <div className="rp-bar-bg">
                      <div className={`rp-bar-fill${i===0?" top":""}`}
                        style={{width:`${(c.count/maxCount)*100}%`}}/>
                    </div>
                  </div>
                  <span className="rp-count">{c.count.toLocaleString("fr-FR")}</span>
                  <span className="rp-pct">{c.pct}%</span>
                </div>
              ))
          }

          {/* Autres */}
          {!loading && (
            <div className="rp-autres">
              <span>🌐 Autres pays</span>
              <div style={{display:"flex",gap:16,alignItems:"center"}}>
                <span className="rp-autres-val">{autres.toLocaleString("fr-FR")}</span>
                <span style={{color:"#5c6070",fontSize:12}}>{autresPct}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Total ── */}
        {!loading && (
          <div className="rp-total">
            <div>
              <div className="rp-total-lbl">Total {METRICS.find(m=>m.id===metric)?.label} — {selPeriod?.label}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span className="rp-total-delta">▲ +32,6%</span>
              <span className="rp-total-val">{total.toLocaleString("fr-FR")}</span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}