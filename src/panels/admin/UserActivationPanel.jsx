import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, RefreshCw, Users, ShieldCheck, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabase';
import MiniStat from '../../components/shared/MiniStat';

export default function UserActivationPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');

  const { data: allProfiles = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminAllProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_profiles')
        .select('id, display_name, username, is_activated, expiry_date, user_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const activateMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('link_profiles').update({ is_activated: true }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['adminAllProfiles'], old =>
        old.map(p => p.id === updated.id ? { ...p, is_activated: true } : p)
      );
      toast.success('✅ Compte activé !');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('link_profiles').update({ is_activated: false }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['adminAllProfiles'], old =>
        old.map(p => p.id === updated.id ? { ...p, is_activated: false } : p)
      );
      toast.success('Compte désactivé');
    },
  });

  const filtered = allProfiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.display_name || '').toLowerCase().includes(q) ||
      (p.username     || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'     ||
      (filter === 'pending' && !p.is_activated) ||
      (filter === 'active'  && p.is_activated);
    return matchSearch && matchFilter;
  });

  const pendingCount = allProfiles.filter(p => !p.is_activated).length;
  const activeCount  = allProfiles.filter(p =>  p.is_activated).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Gestion des comptes</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            {allProfiles.length} profils · {pendingCount} en attente
          </p>
        </div>
        <button onClick={() => refetch()}
          style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <RefreshCw size={13} color="rgba(255,255,255,0.5)" style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        <MiniStat label="Total"      value={allProfiles.length} icon={Users}       color="#a78bfa" />
        <MiniStat label="Activés"    value={activeCount}        icon={ShieldCheck}  color="#22c55e" />
        <MiniStat label="En attente" value={pendingCount}       icon={Clock}        color="#f97316" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 10px 8px 28px', color: 'white', fontSize: '12px', outline: 'none' }} />
        </div>
        {[['pending','⏳ Attente'],['active','✓ Actifs'],['all','Tous']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid ' + (filter === v ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'), background: filter === v ? 'rgba(99,102,241,0.15)' : 'transparent', color: filter === v ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', fontWeight: filter === v ? 600 : 400, whiteSpace: 'nowrap' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Profile list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Loader2 size={16} className="animate-spin" color="rgba(255,255,255,0.3)" />
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', padding: '24px' }}>
            {filter === 'pending' ? '🎉 Aucun compte en attente' : 'Aucun résultat'}
          </p>
        ) : filtered.map(p => (
          <div key={p.id}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: p.is_activated ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {(p.display_name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.display_name || 'Sans nom'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>
                {p.username ? '@' + p.username : 'Sans username'}
              </p>
            </div>
            {p.is_activated ? (
              <button onClick={() => deactivateMutation.mutate(p.id)}
                style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <X size={10} /> Désact.
              </button>
            ) : (
              <button onClick={() => activateMutation.mutate(p.id)}
                style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Check size={10} /> Activer
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
