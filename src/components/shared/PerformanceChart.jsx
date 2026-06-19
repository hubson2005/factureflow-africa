// PerformanceChart.jsx
// Composant : Évolution des performances
// npm install react-chartjs-2 chart.js @supabase/supabase-js

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler
);

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
  --green:#22d07a;--greenD:rgba(34,208,122,0.1);
  --blue:#4d9cf8;--blueD:rgba(77,156,248,0.1);
  --red:#f45b5b;--t1:#f0f0f0;--t2:#9fa3b0;--t3:#5c6070;
}
.pc-wrap{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;font-family:'DM Sans',sans-serif;color:var(--t1)}

/* ── Header ── */
.pc-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.pc-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700}
.pc-hdr-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ── Sélecteur de période ── */
.period-sel{position:relative}
.period-btn{display:flex;align-items:center;gap:6px;background:var(--hover);border:1px solid var(--border);border-radius:9px;padding:6px 12px;font-size:12.5px;color:var(--t2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .12s;white-space:nowrap}
.period-btn:hover{background:var(--hover2);color:var(--t1)}
.period-dropdown{position:absolute;top:calc(100% + 6px);right:0;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:4px;min-width:160px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:fadeIn .15s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.period-opt{padding:7px 12px;border-radius:7px;font-size:12.5px;cursor:pointer;color:var(--t2);transition:all .12s}
.period-opt:hover{background:var(--hover);color:var(--t1)}
.period-opt.on{background:var(--orangeD);color:var(--orange);font-weight:600}

/* ── Type chart ── */
.chart-type-btns{display:flex;background:var(--hover);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.ct-btn{padding:5px 10px;font-size:13px;cursor:pointer;border:none;background:none;color:var(--t2);transition:all .12s;font-family:'DM Sans',sans-serif}
.ct-btn:hover{color:var(--t1)}
.ct-btn.on{background:var(--hover2);color:var(--t1)}

/* ── KPI cards ── */
.pc-kpis{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.kpi{background:var(--hover);border:1px solid var(--border);border-radius:11px;padding:11px 14px;flex:1;min-width:100px;display:flex;flex-direction:column;gap:4px}
.kpi-lbl{font-size:11px;color:var(--t2);display:flex;align-items:center;gap:5px}
.kpi-val{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;line-height:1.1}
.kpi-delta{font-size:10.5px;font-weight:600;display:flex;align-items:center;gap:3px}
.kpi-delta.up{color:var(--green)}
.kpi-delta.down{color:var(--red)}

/* ── Legend ── */
.pc-legend{display:flex;align-items:center;gap:14px;margin-bottom:10px;flex-wrap:wrap}
.leg{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--t2);cursor:pointer;user-select:none;transition:opacity .15s}
.leg.hidden{opacity:.35}
.leg-dot{width:9px;height:9px;border-radius:50%}
.leg-line{width:16px;height:3px;border-radius:2px}

/* ── Chart container ── */
.pc-chart{position:relative;height:220px}

/* ── Skeleton ── */
.sk{background:rgba(255,255,255,.06);border-radius:7px;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

/* ── Comparaison ── */
.pc-compare{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;gap:8px}
.compare-item{display:flex;flex-direction:column;align-items:center;gap:2px}
.compare-lbl{font-size:10.5px;color:var(--t3)}
.compare-val{font-size:13px;font-weight:600}
.compare-arrow{font-size:11px;font-weight:700}
.ca-up{color:var(--green)}
.ca-down{color:var(--red)}
`;

/* ─── Périodes disponibles ─────────────────────────────────── */
const PERIODS = [
  { id:"7d",   label:"7 derniers jours",  days:7  },
  { id:"14d",  label:"14 derniers jours", days:14 },
  { id:"30d",  label:"30 derniers jours", days:30 },
  { id:"90d",  label:"3 derniers mois",   days:90 },
  { id:"365d", label:"Cette année",       days:365},
];

/* ─── Données de démo par période ─────────────────────────── */
const DEMO_DATA = {
  "7d": {
    labels:["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],
    views: [520,680,590,720,810,640,250],
    clicks:[110,145, 98,160,175,120, 34],
    leads: [ 28, 35, 22, 40, 48, 30, 12],
  },
  "14d": {
    labels:["S1-L","S1-M","S1-Me","S1-J","S1-V","S1-S","S1-D","S2-L","S2-M","S2-Me","S2-J","S2-V","S2-S","S2-D"],
    views: [410,520,480,610,700,580,210,520,680,590,720,810,640,250],
    clicks:[ 90,110, 85,130,150,100, 25,110,145, 98,160,175,120, 34],
    leads: [ 20, 28, 18, 32, 40, 25,  8, 28, 35, 22, 40, 48, 30, 12],
  },
  "30d": {
    labels:Array.from({length:30},(_,i)=>`J${i+1}`),
    views: Array.from({length:30},()=>Math.floor(Math.random()*600+300)),
    clicks:Array.from({length:30},()=>Math.floor(Math.random()*150+50)),
    leads: Array.from({length:30},()=>Math.floor(Math.random()*50+10)),
  },
  "90d": {
    labels:["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"].slice(0,3).flatMap(m=>[`${m} S1`,`${m} S2`,`${m} S3`,`${m} S4`]).slice(0,12),
    views: [3200,4100,3800,4500,5100,4200,3900,5200,4800,5500,6100,4700],
    clicks:[ 680, 890, 750, 960,1100, 870, 820,1100, 990,1150,1300, 980],
    leads: [ 180, 230, 200, 260, 300, 240, 220, 290, 265, 310, 350, 260],
  },
  "365d": {
    labels:["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"],
    views: [12000,14500,13200,16000,18500,15200,14000,19000,17500,20000,22500,17000],
    clicks:[ 2500, 3100, 2800, 3400, 4000, 3200, 2950, 4100, 3700, 4300, 4800, 3600],
    leads: [  650,  810,  730,  900, 1050,  840,  780, 1080,  970, 1130, 1260,  950],
  },
};

/* ─── Composant ─────────────────────────────────────────────── */
export default function PerformanceChart({ embedded = false }) {
  const [period,   setPeriod]   = useState("7d");
  const [showDrop, setShowDrop] = useState(false);
  const [chartType,setChartType]= useState("line"); // "line" | "bar"
  const [hidden,   setHidden]   = useState({});     // séries masquées
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);

  /* Chargement données */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows } = await supabase
        .from("performance_daily")
        .select("day_label, date, views, clicks, leads")
        .order("date", { ascending: true })
        .limit(PERIODS.find(p=>p.id===period)?.days || 7);

      if (rows && rows.length > 0) {
        setData({
          labels: rows.map(r => r.day_label),
          views:  rows.map(r => r.views  || 0),
          clicks: rows.map(r => r.clicks || 0),
          leads:  rows.map(r => r.leads  || 0),
        });
      } else {
        // Données de démo
        setData(DEMO_DATA[period] || DEMO_DATA["7d"]);
      }
    } catch {
      setData(DEMO_DATA[period] || DEMO_DATA["7d"]);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* KPI calculés */
  const kpis = data ? [
    {
      lbl:"👁 Vues",
      val: data.views.reduce((a,b)=>a+b,0).toLocaleString("fr-FR"),
      delta:"+32,6%", up:true, col:"#f5841f",
    },
    {
      lbl:"👆 Clics",
      val: data.clicks.reduce((a,b)=>a+b,0).toLocaleString("fr-FR"),
      delta:"+28,4%", up:true, col:"#f5841f",
    },
    {
      lbl:"➕ Leads",
      val: data.leads.reduce((a,b)=>a+b,0).toLocaleString("fr-FR"),
      delta:"+46,7%", up:true, col:"#22d07a",
    },
    {
      lbl:"📈 Taux clics",
      val: data.views.reduce((a,b)=>a+b,0) > 0
        ? `${((data.clicks.reduce((a,b)=>a+b,0)/data.views.reduce((a,b)=>a+b,0))*100).toFixed(1)}%`
        : "0%",
      delta:"-2,1%", up:false, col:"#4d9cf8",
    },
  ] : [];

  /* Datasets */
  const SERIES = [
    { key:"views",  label:"Vues",  color:"#f5841f", data: data?.views  || [] },
    { key:"clicks", label:"Clics", color:"#4d9cf8", data: data?.clicks || [] },
    { key:"leads",  label:"Leads", color:"#22d07a", data: data?.leads  || [] },
  ];

  const makeDatasets = () => SERIES
    .filter(s => !hidden[s.key])
    .map(s => chartType === "line"
      ? {
          label: s.label,
          data: s.data,
          borderColor: s.color,
          backgroundColor: `${s.color}18`,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: s.color,
          tension: 0.4,
          fill: true,
        }
      : {
          label: s.label,
          data: s.data,
          backgroundColor: s.color,
          borderRadius: 5,
          borderSkipped: false,
          barPercentage: 0.65,
        }
    );

  const chartData = data ? { labels: data.labels, datasets: makeDatasets() } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#16181c",
        borderColor: "rgba(255,255,255,.09)",
        borderWidth: 1,
        titleColor: "#f0f0f0",
        bodyColor: "#9fa3b0",
        padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString("fr-FR")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,.04)" },
        ticks: { color: "#5c6070", font: { size: 10.5 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,.04)" },
        ticks: { color: "#5c6070", font: { size: 10.5 } },
      },
    },
  };

  const selPeriod = PERIODS.find(p=>p.id===period);
  const ChartCmp = chartType === "line" ? Line : Bar;

  return (
    <>
      <style>{STYLE}</style>
      <div className="pc-wrap">

        {/* ── En-tête ── */}
        <div className="pc-hdr">
          <div className="pc-title">📈 Évolution des performances</div>
          <div className="pc-hdr-right">

            {/* Toggle line / bar */}
            <div className="chart-type-btns">
              <button className={`ct-btn${chartType==="line"?" on":""}`} onClick={()=>setChartType("line")} title="Courbe">📉</button>
              <button className={`ct-btn${chartType==="bar"?" on":""}`}  onClick={()=>setChartType("bar")}  title="Barres">📊</button>
            </div>

            {/* Sélecteur de période */}
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

            {/* Actualiser */}
            <button className="period-btn" onClick={fetchData} title="Actualiser">↻</button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="pc-kpis">
          {loading
            ? Array(4).fill(0).map((_,i)=><div key={i} className="kpi"><div className="sk" style={{height:14,width:"60%"}}/><div className="sk" style={{height:22,width:"80%",marginTop:5}}/></div>)
            : kpis.map(k=>(
              <div key={k.lbl} className="kpi">
                <div className="kpi-lbl">{k.lbl}</div>
                <div className="kpi-val" style={{color:k.col}}>{k.val}</div>
                <div className={`kpi-delta ${k.up?"up":"down"}`}>
                  {k.up?"▲":"▼"} {k.delta}
                </div>
              </div>
            ))
          }
        </div>

        {/* ── Légende interactive ── */}
        <div className="pc-legend">
          {SERIES.map(s=>(
            <div key={s.key} className={`leg${hidden[s.key]?" hidden":""}`}
              onClick={()=>setHidden(h=>({...h,[s.key]:!h[s.key]}))}>
              {chartType==="line"
                ? <div className="leg-line" style={{background:s.color}}/>
                : <div className="leg-dot"  style={{background:s.color}}/>
              }
              {s.label}
            </div>
          ))}
          <span style={{fontSize:11,color:"#5c6070",marginLeft:"auto"}}>Clic pour masquer</span>
        </div>

        {/* ── Graphique ── */}
        <div className="pc-chart">
          {loading
            ? <div className="sk" style={{height:"100%",borderRadius:10}}/>
            : chartData
              ? <ChartCmp data={chartData} options={chartOptions}/>
              : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#5c6070",fontSize:13}}>Aucune donnée disponible</div>
          }
        </div>

        {/* ── Comparaison période précédente ── */}
        {!loading && data && (
          <div className="pc-compare">
            <div className="compare-item">
              <span className="compare-lbl">Vues vs période préc.</span>
              <span className="compare-val">
                {data.views.reduce((a,b)=>a+b,0).toLocaleString("fr-FR")}
                <span className="compare-arrow ca-up"> ▲ +32,6%</span>
              </span>
            </div>
            <div style={{width:1,height:30,background:"var(--border)"}}/>
            <div className="compare-item">
              <span className="compare-lbl">Clics vs période préc.</span>
              <span className="compare-val">
                {data.clicks.reduce((a,b)=>a+b,0).toLocaleString("fr-FR")}
                <span className="compare-arrow ca-up"> ▲ +28,4%</span>
              </span>
            </div>
            <div style={{width:1,height:30,background:"var(--border)"}}/>
            <div className="compare-item">
              <span className="compare-lbl">Leads vs période préc.</span>
              <span className="compare-val">
                {data.leads.reduce((a,b)=>a+b,0).toLocaleString("fr-FR")}
                <span className="compare-arrow ca-up"> ▲ +46,7%</span>
              </span>
            </div>
            <div style={{width:1,height:30,background:"var(--border)"}}/>
            <div className="compare-item">
              <span className="compare-lbl">Meilleur jour</span>
              <span className="compare-val" style={{color:"var(--orange)"}}>
                {data.labels[data.views.indexOf(Math.max(...data.views))]}
                <span style={{fontSize:11,color:"var(--t3)",fontWeight:400}}> ({Math.max(...data.views).toLocaleString("fr-FR")} vues)</span>
              </span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
