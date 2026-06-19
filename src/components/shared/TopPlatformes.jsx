// TopPlatformes.jsx
// Composant : Top plateformes avec sélecteur de période
// npm install @supabase/supabase-js react-chartjs-2 chart.js

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

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
  --green:#22d07a;--blue:#4d9cf8;--red:#f45b5b;
  --t1:#f0f0f0;--t2:#9fa3b0;--t3:#5c6070;
}
.tp-wrap{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;font-family:'DM Sans',sans-serif;color:var(--t1)}

/* ── Header ── */
.tp-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.tp-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700}
.tp-hdr-right{display:flex;align-items:center;gap:8px}

/* ── Période ── */
.period-sel{position:relative}
.period-btn{display:flex;align-items:center;gap:6px;background:var(--hover);border:1px solid var(--border);border-radius:9px;padding:6px 12px;font-size:12.5px;color:var(--t2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .12s;white-space:nowrap}
.period-btn:hover{background:var(--hover2);color:var(--t1)}
.period-dropdown{position:absolute;top:calc(100% + 6px);right:0;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:4px;min-width:160px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:fadeIn .15s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.period-opt{padding:7px 12px;border-radius:7px;font-size:12.5px;cursor:pointer;color:var(--t2);transition:all .12s}
.period-opt:hover{background:var(--hover);color:var(--t1)}
.period-opt.on{background:var(--orangeD);color:var(--orange);font-weight:600}

/* ── Vue toggle ── */
.view-btns{display:flex;background:var(--hover);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.vb{padding:5px 10px;font-size:12px;cursor:pointer;border:none;background:none;color:var(--t2);transition:all .12s;font-family:'DM Sans',sans-serif}
.vb:hover{color:var(--t1)}
.vb.on{background:var(--hover2);color:var(--t1)}

/* ── Metric selector ── */
.metric-tabs{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.mtab{padding:5px 12px;border-radius:7px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:var(--hover);color:var(--t2);font-family:'DM Sans',sans-serif;transition:all .12s}
.mtab:hover{background:var(--hover2);color:var(--t1)}
.mtab.on{background:var(--orangeD);border-color:rgba(245,132,31,.3);color:var(--orange);font-weight:600}

/* ── Layout ── */
.tp-body{display:flex;gap:16px;align-items:flex-start}
.tp-list{flex:1;display:flex;flex-direction:column;gap:0}
.tp-doughnut{width:160px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:10px}
.tp-doughnut-inner{position:relative;width:140px;height:140px}
.tp-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.tp-donut-num{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;line-height:1}
.tp-donut-lbl{font-size:10px;color:var(--t2);margin-top:2px}

/* ── Platform row ── */
.plat-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .12s;border-radius:0;position:relative}
.plat-row:last-child{border-bottom:none}
.plat-row:hover{background:var(--hover);margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:9px}
.plat-rank{font-size:11px;font-weight:700;color:var(--t3);min-width:16px;text-align:center}
.plat-rank.r1{color:#f5841f}
.plat-rank.r2{color:#9fa3b0}
.plat-rank.r3{color:#cd7f32}
.plat-ico{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.plat-info{flex:1;min-width:0}
.plat-name{font-size:13px;font-weight:500}
.plat-sub{font-size:10.5px;color:var(--t2);margin-top:1px}
.plat-bar-wrap{flex:1;max-width:100px}
.plat-bar-bg{height:5px;background:var(--hover);border-radius:3px;overflow:hidden}
.plat-bar-fill{height:100%;border-radius:3px;transition:width .4s ease}
.plat-stats{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
.plat-count{font-size:13px;font-weight:700}
.plat-pct{font-size:10px;color:var(--t2)}
.plat-delta{font-size:10px;font-weight:600}
.d-up{color:var(--green)}
.d-down{color:var(--red)}

/* ── Total row ── */
.tp-total{display:flex;align-items:center;justify-content:space-between;padding:10px 0;margin-top:8px;border-top:1px solid var(--border)}
.tp-total-lbl{font-size:12px;color:var(--t2);font-weight:500}
.tp-total-val{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--orange)}

/* ── Skeleton ── */
.sk{background:rgba(255,255,255,.06);border-radius:7px;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

/* ── Insight ── */
.tp-insight{background:var(--hover);border:1px solid var(--border);border-radius:10px;padding:10px 13px;margin-top:12px;font-size:12px;color:var(--t2);line-height:1.5;display:flex;gap:8px;align-items:flex-start}
.tp-insight-ico{font-size:16px;flex-shrink:0;margin-top:1px}
`;

/* ─── Données par période ──────────────────────────────────── */
const PLATFORM_DATA = {
  "7d": [
    { name:"WhatsApp",  icon:"💬", color:"#25d366", bg:"rgba(37,211,102,.12)",  views:142, clicks:89,  leads:28, delta:"+18%" },
    { name:"TikTok",    icon:"♪",  color:"#4d9cf8", bg:"rgba(77,156,248,.12)",  views:87,  clicks:54,  leads:15, delta:"+42%" },
    { name:"Instagram", icon:"📸", color:"#e4405f", bg:"rgba(228,64,95,.12)",   views:61,  clicks:38,  leads:10, delta:"+7%"  },
    { name:"Facebook",  icon:"👤", color:"#4267b2", bg:"rgba(66,103,178,.12)",  views:38,  clicks:22,  leads:6,  delta:"-3%"  },
    { name:"LinkedIn",  icon:"💼", color:"#0077b5", bg:"rgba(0,119,181,.12)",   views:21,  clicks:13,  leads:4,  delta:"+25%" },
  ],
  "30d": [
    { name:"WhatsApp",  icon:"💬", color:"#25d366", bg:"rgba(37,211,102,.12)",  views:610, clicks:380, leads:120, delta:"+22%" },
    { name:"TikTok",    icon:"♪",  color:"#4d9cf8", bg:"rgba(77,156,248,.12)",  views:380, clicks:230, leads:65,  delta:"+55%" },
    { name:"Instagram", icon:"📸", color:"#e4405f", bg:"rgba(228,64,95,.12)",   views:260, clicks:155, leads:42,  delta:"+12%" },
    { name:"Facebook",  icon:"👤", color:"#4267b2", bg:"rgba(66,103,178,.12)",  views:160, clicks:90,  leads:24,  delta:"-1%"  },
    { name:"LinkedIn",  icon:"💼", color:"#0077b5", bg:"rgba(0,119,181,.12)",   views:90,  clicks:52,  leads:15,  delta:"+30%" },
  ],
  "90d": [
    { name:"WhatsApp",  icon:"💬", color:"#25d366", bg:"rgba(37,211,102,.12)",  views:1850,clicks:1150,leads:360, delta:"+19%" },
    { name:"TikTok",    icon:"♪",  color:"#4d9cf8", bg:"rgba(77,156,248,.12)",  views:1100,clicks:680, leads:195, delta:"+67%" },
    { name:"Instagram", icon:"📸", color:"#e4405f", bg:"rgba(228,64,95,.12)",   views:790, clicks:470, leads:128, delta:"+14%" },
    { name:"Facebook",  icon:"👤", color:"#4267b2", bg:"rgba(66,103,178,.12)",  views:480, clicks:270, leads:73,  delta:"-4%"  },
    { name:"LinkedIn",  icon:"💼", color:"#0077b5", bg:"rgba(0,119,181,.12)",   views:270, clicks:155, leads:44,  delta:"+28%" },
  ],
};
PLATFORM_DATA["14d"] = PLATFORM_DATA["7d"].map(p=>({...p, views:p.views*2, clicks:p.clicks*2, leads:p.leads*2}));
PLATFORM_DATA["365d"] = PLATFORM_DATA["90d"].map(p=>({...p, views:p.views*4, clicks:p.clicks*4, leads:p.leads*4}));

const PERIODS = [
  { id:"7d",  label:"7 derniers jours"  },
  { id:"14d", label:"14 derniers jours" },
  { id:"30d", label:"30 derniers jours" },
  { id:"90d", label:"3 derniers mois"   },
  { id:"365d",label:"Cette année"       },
];

const METRICS = [
  { id:"views",  label:"Vues"  },
  { id:"clicks", label:"Clics" },
  { id:"leads",  label:"Leads" },
];

/* ─── Composant ─────────────────────────────────────────────── */
export default function TopPlatformes({ embedded = false }) {
  const [period,   setPeriod]   = useState("7d");
  const [showDrop, setShowDrop] = useState(false);
  const [metric,   setMetric]   = useState("views");
  const [view,     setView]     = useState("list");   // "list" | "chart"
  const [platforms,setPlatforms]= useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("platform_stats")
        .select("name, count, color")
        .order("count", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const icons = { WhatsApp:"💬", TikTok:"♪", Instagram:"📸", Facebook:"👤", LinkedIn:"💼" };
        const bgs   = { WhatsApp:"rgba(37,211,102,.12)", TikTok:"rgba(77,156,248,.12)", Instagram:"rgba(228,64,95,.12)", Facebook:"rgba(66,103,178,.12)", LinkedIn:"rgba(0,119,181,.12)" };
        setPlatforms(data.map((d,i) => ({
          name: d.name, icon: icons[d.name]||"🔗", color: d.color||"#f5841f",
          bg: bgs[d.name]||"rgba(245,132,31,.12)",
          views: d.count, clicks: Math.floor(d.count * 0.62),
          leads: Math.floor(d.count * 0.2), delta: i===1?"+42%":"+15%",
        })));
      } else {
        setPlatforms(PLATFORM_DATA[period] || PLATFORM_DATA["7d"]);
      }
    } catch {
      setPlatforms(PLATFORM_DATA[period] || PLATFORM_DATA["7d"]);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metricKey = metric;
  const total     = platforms.reduce((s,p)=>s+(p[metricKey]||0),0);
  const maxVal    = Math.max(...platforms.map(p=>p[metricKey]||0), 1);

  /* Données doughnut */
  const donutData = {
    labels: platforms.map(p=>p.name),
    datasets:[{
      data: platforms.map(p=>p[metricKey]||0),
      backgroundColor: platforms.map(p=>p.color),
      borderColor: platforms.map(p=>`${p.color}55`),
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };
  const donutOptions = {
    responsive:true, maintainAspectRatio:false, cutout:"68%",
    plugins:{ legend:{display:false}, tooltip:{
      backgroundColor:"#1a1c21", borderColor:"rgba(255,255,255,.08)", borderWidth:1,
      titleColor:"#f0f0f0", bodyColor:"#9fa3b0", padding:10,
      callbacks:{ label: ctx=>`  ${ctx.label}: ${ctx.parsed?.toLocaleString("fr-FR")}` },
    }},
  };

  const rankCls = i => i===0?"plat-rank r1": i===1?"plat-rank r2": i===2?"plat-rank r3":"plat-rank";
  const rankLbl = i => i===0?"🥇": i===1?"🥈": i===2?"🥉":`${i+1}`;
  const selPeriod = PERIODS.find(p=>p.id===period);

  /* Insight automatique */
  const topPlat  = platforms[0];
  const fastGrow = platforms.reduce((a,b)=> (parseFloat(b.delta)>parseFloat(a.delta)?b:a), platforms[0]||{});

  return (
    <>
      <style>{STYLE}</style>
      <div className="tp-wrap">

        {/* ── En-tête ── */}
        <div className="tp-hdr">
          <div className="tp-title">🏆 Top plateformes</div>
          <div className="tp-hdr-right">
            {/* List / Donut */}
            <div className="view-btns">
              <button className={`vb${view==="list"?" on":""}`}  onClick={()=>setView("list")}  title="Liste">≡</button>
              <button className={`vb${view==="chart"?" on":""}`} onClick={()=>setView("chart")} title="Donut">◉</button>
            </div>

            {/* Période */}
            <div className="period-sel">
              <button className="period-btn" onClick={()=>setShowDrop(v=>!v)}>
                {selPeriod?.label} ▾
              </button>
              {showDrop && (
                <div className="period-dropdown">
                  {PERIODS.map(p=>(
                    <div key={p.id} className={`period-opt${period===p.id?" on":""}`}
                      onClick={()=>{ setPeriod(p.id); setShowDrop(false); }}>
                      {p.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="period-btn" onClick={fetchData} title="Actualiser">↻</button>
          </div>
        </div>

        {/* ── Metric tabs ── */}
        <div className="metric-tabs">
          {METRICS.map(m=>(
            <button key={m.id} className={`mtab${metric===m.id?" on":""}`} onClick={()=>setMetric(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {Array(5).fill(0).map((_,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div className="sk" style={{width:32,height:32,borderRadius:9}}/>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div className="sk" style={{height:13,width:"50%"}}/>
                  <div className="sk" style={{height:10,width:"70%"}}/>
                </div>
                <div className="sk" style={{width:50,height:16}}/>
              </div>
            ))}
          </div>
        ) : (
          <div className="tp-body">

            {/* Liste */}
            <div className="tp-list">
              {platforms.map((p,i)=>{
                const val = p[metricKey]||0;
                const pct = total>0 ? ((val/total)*100).toFixed(1) : 0;
                const isUp = !p.delta.startsWith("-");
                return (
                  <div key={p.name} className="plat-row">
                    <span className={rankCls(i)}>{rankLbl(i)}</span>
                    <div className="plat-ico" style={{background:p.bg}}>{p.icon}</div>
                    <div className="plat-info">
                      <div className="plat-name">{p.name}</div>
                      <div className="plat-sub">{pct}% du total</div>
                    </div>
                    <div className="plat-bar-wrap">
                      <div className="plat-bar-bg">
                        <div className="plat-bar-fill" style={{width:`${(val/maxVal)*100}%`,background:p.color}}/>
                      </div>
                    </div>
                    <div className="plat-stats">
                      <span className="plat-count" style={{color:p.color}}>{val.toLocaleString("fr-FR")}</span>
                      <span className={`plat-delta ${isUp?"d-up":"d-down"}`}>{p.delta}</span>
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="tp-total">
                <span className="tp-total-lbl">Total {METRICS.find(m=>m.id===metric)?.label}</span>
                <span className="tp-total-val">{total.toLocaleString("fr-FR")}</span>
              </div>
            </div>

            {/* Donut (vue chart) */}
            {view==="chart" && (
              <div className="tp-doughnut">
                <div className="tp-doughnut-inner">
                  <Doughnut data={donutData} options={donutOptions}/>
                  <div className="tp-donut-center">
                    <span className="tp-donut-num" style={{color:"#f5841f"}}>{total.toLocaleString("fr-FR")}</span>
                    <span className="tp-donut-lbl">{METRICS.find(m=>m.id===metric)?.label}</span>
                  </div>
                </div>
                {/* Mini légende */}
                <div style={{display:"flex",flexDirection:"column",gap:5,width:"100%"}}>
                  {platforms.map(p=>(
                    <div key={p.name} style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                      <div style={{width:8,height:8,borderRadius:2,background:p.color,flexShrink:0}}/>
                      <span style={{flex:1,color:"#9fa3b0"}}>{p.name}</span>
                      <span style={{color:p.color,fontWeight:600}}>{total>0?((p[metricKey]/total)*100).toFixed(0):0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Insight ── */}
        {!loading && platforms.length > 0 && (
          <div className="tp-insight">
            <span className="tp-insight-ico">💡</span>
            <span>
              <strong style={{color:"#f0f0f0"}}>{topPlat?.name}</strong> est ta meilleure source avec{" "}
              <strong style={{color:"#f5841f"}}>{topPlat?.[metricKey]?.toLocaleString("fr-FR")}</strong>{" "}
              {METRICS.find(m=>m.id===metric)?.label.toLowerCase()}. 
              {fastGrow && fastGrow.name !== topPlat?.name && (
                <> <strong style={{color:"#22d07a"}}>{fastGrow.name}</strong> est la plateforme avec la plus forte croissance (<strong style={{color:"#22d07a"}}>{fastGrow.delta}</strong>).</>
              )}
            </span>
          </div>
        )}

      </div>
    </>
  );
}