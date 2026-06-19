import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Search, Trash2, Download, UserPlus, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabase';

const TAGS = [
  { id: 'prospect', label: 'Prospect',  color: '#6366f1' },
  { id: 'chaud',    label: '🔥 Chaud',  color: '#ef4444' },
  { id: 'client',   label: '✅ Client', color: '#22c55e' },
  { id: 'froid',    label: '❄️ Froid',  color: '#0ea5e9' },
  { id: 'perdu',    label: 'Perdu',     color: '#6b7280' },
];

const EMPTY_LEAD = { name: '', email: '', phone: '', tag: 'prospect', notes: '' };

export default function LeadsCRMPanel({ profileId }) {
  const [leads,       setLeads]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [showAdd,     setShowAdd]     = useState(false);
  const [newLead,     setNewLead]     = useState(EMPTY_LEAD);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('leads').select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      setLeads(data || []);
      setLoading(false);
    })();
  }, [profileId]);

  const addLead = async () => {
    if (!newLead.name.trim()) { toast.error('Nom requis'); return; }
    const { data, error } = await supabase
      .from('leads').insert([{ ...newLead, profile_id: profileId }]).select().single();
    if (error) { toast.error('Erreur : ' + error.message); return; }
    setLeads(prev => [data, ...prev]);
    setNewLead(EMPTY_LEAD);
    setShowAdd(false);
    toast.success('Lead ajouté !');
  };

  const updateTag = async (id, tag) => {
    await supabase.from('leads').update({ tag }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, tag } : l));
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Supprimer ce lead ?')) return;
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success('Lead supprimé');
  };

  const exportCSV = () => {
    const csv = [
      'Nom,Email,Téléphone,Tag,Notes',
      ...leads.map(l =>
        [l.name, l.email, l.phone, l.tag, l.notes]
          .map(v => '"' + (v || '') + '"').join(',')
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = 'leads.csv';
    a.click();
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.name  || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' || l.tag === filter;
    return matchSearch && matchFilter;
  });

  const tagCounts = TAGS.reduce((acc, t) => {
    acc[t.id] = leads.filter(l => l.tag === t.id).length;
    return acc;
  }, {});

  const inputStyle = {
    padding: '9px 12px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '12px',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Leads & CRM</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '3px 0 0' }}>
            {leads.length} contact{leads.length > 1 ? 's' : ''} dans votre pipeline
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => setShowAdd(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> Ajouter lead
          </button>
        </div>
      </div>

      {/* Tag filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TAGS.map(t => (
          <button key={t.id} onClick={() => setFilter(filter === t.id ? 'all' : t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid ' + (filter === t.id ? t.color : 'rgba(255,255,255,0.1)'), background: filter === t.id ? t.color + '22' : 'rgba(255,255,255,0.04)', color: filter === t.id ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
            {t.label}
            <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 5px', fontSize: '10px' }}>
              {tagCounts[t.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '18px', padding: '16px', overflow: 'hidden' }}>
            <h3 style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 12px' }}>Nouveau lead</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              {[['name','Nom *'],['email','Email'],['phone','Téléphone']].map(([key, ph]) => (
                <input key={key} type="text" placeholder={ph} value={newLead[key]}
                  onChange={e => setNewLead(p => ({ ...p, [key]: e.target.value }))}
                  style={inputStyle} />
              ))}
              <select value={newLead.tag} onChange={e => setNewLead(p => ({ ...p, tag: e.target.value }))}
                style={{ ...inputStyle }}>
                {TAGS.map(t => <option key={t.id} value={t.id} style={{ background: '#0a0817' }}>{t.label}</option>)}
              </select>
            </div>
            <textarea placeholder="Notes..." value={newLead.notes}
              onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} rows={2}
              style={{ ...inputStyle, width: '100%', resize: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addLead} style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Enregistrer</button>
              <button onClick={() => setShowAdd(false)} style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un lead..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px', outline: 'none' }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}><Loader2 size={20} className="animate-spin" color="rgba(99,102,241,0.6)" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          <UserPlus size={24} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>Aucun lead pour l'instant</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(lead => {
            const tag = TAGS.find(t => t.id === lead.tag) || TAGS[0];
            return (
              <motion.div key={lead.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tag.color + '22', border: '1px solid ' + tag.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: tag.color, flexShrink: 0 }}>
                  {(lead.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>{lead.name}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                    {lead.email && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={10} />{lead.email}</span>}
                    {lead.phone && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} />{lead.phone}</span>}
                  </div>
                  {lead.notes && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.notes}</p>}
                </div>
                <select value={lead.tag} onChange={e => updateTag(lead.id, e.target.value)}
                  style={{ padding: '5px 8px', background: tag.color + '22', border: '1px solid ' + tag.color + '55', borderRadius: '8px', color: tag.color, fontSize: '11px', fontWeight: 600, cursor: 'pointer', outline: 'none', flexShrink: 0 }}>
                  {TAGS.map(t => <option key={t.id} value={t.id} style={{ background: '#0a0817', color: 'white' }}>{t.label}</option>)}
                </select>
                <button onClick={() => deleteLead(lead.id)}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <Trash2 size={11} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
