import React from 'react';
import { Save, Loader2, AtSign, BadgeCheck, CalendarClock, ArrowUpRight, Radio, BarChart3, UserPlus, Link2 } from 'lucide-react';
import ProfileHeader from '@/components/dashboard/ProfileHeader';
import QRCodeDisplay from '@/components/dashboard/QRCodeDisplay';
import StatsCard from '@/components/dashboard/StatsCard';

export default function OverviewPanel({ profile, onNavigate, onUpdate, onSave, hasChanges, saving }) {
  const quickActions = [
    { label: 'Temps réel',  icon: Radio,     color: '#22c55e', section: 'realtime',  desc: 'Visiteurs en direct' },
    { label: 'Analytics',   icon: BarChart3, color: '#6366f1', section: 'analytics', desc: 'Performances' },
    { label: 'Leads',       icon: UserPlus,  color: '#f59e0b', section: 'leads',     desc: 'Gérer les contacts' },
    { label: 'Plateformes', icon: Link2,     color: '#0ea5e9', section: 'platforms', desc: (profile?.links?.length || 0) + ' lien(s)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0 }}>Dashboard</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '4px 0 0' }}>
          Bienvenue sur votre dashboard SocialApp
        </p>
      </div>

      {/* ── Row 1 : Profile | QR Code | Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', alignItems: 'start' }}>

        {/* Profile card */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', overflow: 'hidden' }}>
          <ProfileHeader profile={profile} onUpdate={onUpdate} />

          {/* Username */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AtSign size={13} color="rgba(255,255,255,0.4)" />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', flexShrink: 0 }}>@</span>
            <input type="text" value={profile?.username || ''} onChange={e => onUpdate({ username: e.target.value })} placeholder="username"
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', flex: 1, minWidth: 0 }} />
          </div>

          {/* Verified badge toggle */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BadgeCheck size={13} color="rgba(255,255,255,0.4)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Badge vérifié</span>
            </div>
            <button onClick={() => onUpdate({ is_verified: !profile?.is_verified })}
              style={{ width: '38px', height: '20px', borderRadius: '100px', background: profile?.is_verified ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: profile?.is_verified ? '21px' : '3px', transition: 'left 0.3s' }} />
            </button>
          </div>

          {/* Expiry */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarClock size={13} color="rgba(255,255,255,0.4)" />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', flexShrink: 0 }}>Exp. :</span>
            <input type="date" value={profile?.expiry_date || ''} onChange={e => onUpdate({ expiry_date: e.target.value })}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', flex: 1, minWidth: 0 }} />
          </div>

          {/* Save */}
          {hasChanges && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px' }}>
              <button onClick={onSave} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Sauvegarder
              </button>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div>
          <QRCodeDisplay profileId={profile?.id} username={profile?.username} isActive={profile?.is_activated} />
        </div>

        {/* Stats */}
        <div>
          <StatsCard profileId={profile?.id} />
        </div>
      </div>

      {/* ── Row 2 : Quick actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
        {quickActions.map(a => (
          <button key={a.section} onClick={() => onNavigate(a.section)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: a.color + '22', border: '1px solid ' + a.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <a.icon size={17} color={a.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>{a.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{a.desc}</p>
            </div>
            <ArrowUpRight size={14} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
