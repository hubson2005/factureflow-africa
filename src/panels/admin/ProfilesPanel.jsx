import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Check, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { getExpiryStatus } from '../../utils/helpers';
import { PROFILES_PER_PAGE } from '../../constants/limits';

export default function ProfilesPanel({ profiles, activeProfileId, onSwitch, onCreate, onDelete }) {
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);

  const filtered = profiles.filter(p =>
    !search ||
    (p.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.username     || '').toLowerCase().includes(search.toLowerCase())
  );
  const paged      = filtered.slice(page * PROFILES_PER_PAGE, (page + 1) * PROFILES_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PROFILES_PER_PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Mes profils</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            {profiles.length} profil(s) créé(s)
          </p>
        </div>
        <button onClick={onCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={13} /> Nouveau profil
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Rechercher un profil..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px', outline: 'none' }} />
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paged.map(p => {
          const expiry  = getExpiryStatus(p.expiry_date);
          const isActive = p.id === activeProfileId;
          return (
            <div key={p.id} onClick={() => onSwitch(p)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (isActive ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'), borderRadius: '14px', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>

              {/* Avatar */}
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isActive ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (p.display_name?.[0]?.toUpperCase() || '?')}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: isActive ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.display_name || 'Sans nom'}
                  </span>
                  {p.is_verified  && <span style={{ color: '#22c55e', fontSize: '11px' }}>✓</span>}
                  {p.is_event     && <span style={{ fontSize: '11px' }}>🎉</span>}
                  {p.is_activated && <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '1px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>✅</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {p.username && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>@{p.username}</span>}
                  {expiry && (
                    <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', color: expiry.color.includes('green') ? '#22c55e' : expiry.color.includes('orange') ? '#f97316' : '#ef4444' }}>
                      <CalendarClock size={9} />{expiry.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {isActive && <Check size={14} color="#6366f1" />}
                {profiles.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); onDelete(p); }}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.6 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', opacity: page >= totalPages - 1 ? 0.3 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
