import React, { useState, useEffect } from 'react';
import { Loader2, Globe, MousePointerClick, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '../../supabase';
import { PLATFORMS } from '../../components/dashboard/AddPlatformDialog';
import MiniStat from '../../components/shared/MiniStat';
import { flagEmoji } from '../../utils/helpers';

export default function AnalyticsPanel({ profileId }) {
  const [period,   setPeriod]   = useState('7d');
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [geoData,  setGeoData]  = useState([]);
  const [topLinks, setTopLinks] = useState([]);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const from = new Date(); from.setDate(from.getDate() - days);

      const { data: viewsData } = await supabase.from('profile_stats').select('created_at, country, country_name, platform').eq('profile_id', profileId).gte('created_at', from.toISOString());
      const { data: prevData }  = await supabase.from('profile_stats').select('id').eq('profile_id', profileId).eq('event_type', 'view').gte('created_at', new Date(from.getTime() - days * 86400000).toISOString()).lt('created_at', from.toISOString());

      const views     = (viewsData || []).filter(r => !r.platform);
      const clicks    = (viewsData || []).filter(r => r.platform);
      const prevCount = prevData?.length || 0;
      const trend     = prevCount > 0 ? Math.round(((views.length - prevCount) / prevCount) * 100) : null;

      setStats({ views: views.length, clicks: clicks.length, ctr: views.length > 0 ? Math.round((clicks.length / views.length) * 100) : 0, trend, trendUp: trend !== null ? trend >= 0 : true });

      const geoMap = {};
      views.forEach(r => { const k = r.country_name || r.country || 'Inconnu'; geoMap[k] = { count: (geoMap[k]?.count || 0) + 1, code: r.country }; });
      setGeoData(Object.entries(geoMap).sort((a, b) => b[1].count - a[1].count).slice(0, 6));

      const clickMap = {};
      clicks.forEach(r => { clickMap[r.platform] = (clickMap[r.platform] || 0) + 1; });
      setTopLinks(Object.entries(clickMap).sort((a, b) => b[1] - a[1]).slice(0, 6));
      setLoading(false);
    })();
  }, [profileId, period]);

  const maxGeo  = geoData[0]?.[1]?.count || 1;
  const maxLink = topLinks[0]?.[1] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Analytics</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '3px 0 0' }}>Vue d'ensemble des performances</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px' }}>
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: period === p ? 'rgba(99,102,241,0.4)' : 'transparent', color: period === p ? 'white' : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 size={24} className="animate-spin" color="rgba(99,102,241,0.6)" /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            <MiniStat label="Vues totales"  value={stats?.views || 0}        icon={Eye}               color="#6366f1" trend={stats?.trend !== null ? Math.abs(stats.trend) + '%' : null} trendUp={stats?.trendUp} />
            <MiniStat label="Clics liens"   value={stats?.clicks || 0}       icon={MousePointerClick} color="#f59e0b" />
            <MiniStat label="Taux de clic"  value={(stats?.ctr || 0) + '%'}  icon={TrendingUp}        color="#22c55e" />
            <MiniStat label="Pays atteints" value={geoData.length}           icon={Globe}             color="#0ea5e9" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Top countries */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><Globe size={14} color="#0ea5e9" /><h3 style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>Top pays</h3></div>
              {geoData.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>Pas encore de données</p>
                : geoData.map(([country, { count, code }]) => (
                  <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px', width: '22px', flexShrink: 0 }}>{flagEmoji(code)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 500 }}>{country}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: Math.round((count / maxGeo) * 100) + '%', background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Top links */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><MousePointerClick size={14} color="#f59e0b" /><h3 style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>Liens les plus cliqués</h3></div>
              {topLinks.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>Pas encore de données</p>
                : topLinks.map(([platform, count]) => {
                  const p = PLATFORMS[platform] || { label: platform, color: '#6366f1' };
                  return (
                    <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.icon ? React.cloneElement(p.icon, { width: 11, height: 11 }) : <span style={{ color: 'white', fontSize: '7px', fontWeight: 'bold' }}>{(p.label || '?')[0]}</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 500, textTransform: 'capitalize' }}>{p.label || platform}</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{count}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                          <div style={{ height: '100%', width: Math.round((count / maxLink) * 100) + '%', background: `linear-gradient(90deg,${p.color},rgba(255,255,255,0.3))`, borderRadius: '2px' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
