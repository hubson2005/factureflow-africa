import React, { useCallback } from 'react';
import { Plus, Link2, AlertCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import PlatformCard from '@/components/dashboard/PlatformCard';
import AddPlatformDialog from '@/components/dashboard/AddPlatformDialog';

export default function PlatformsPanel({ localProfile, updateLocal, limits, showAddDialog, setShowAddDialog }) {
  const links   = localProfile?.links || [];
  const atLimit = links.length >= limits.maxLinks;

  const handleUpdateLink = useCallback((index, updated) => {
    const l = [...(localProfile?.links || [])];
    l[index] = updated;
    updateLocal({ links: l });
  }, [localProfile, updateLocal]);

  const handleRemoveLink = useCallback((index) => {
    const l = (localProfile?.links || []).filter((_, i) => i !== index);
    updateLocal({ links: l });
  }, [localProfile, updateLocal]);

  const handleAddPlatform = (key) => {
    if (atLimit) { toast.error(`Limite atteinte — offre ${limits.label} : ${limits.maxLinks} liens max`); return; }
    updateLocal({ links: [...links, { id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }] });
    setShowAddDialog(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Mes plateformes</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            {links.length} / {limits.maxLinks} liens utilisés
          </p>
        </div>
        <button onClick={() => setShowAddDialog(true)} disabled={atLimit}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: atLimit ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: atLimit ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '12px', fontWeight: 600, cursor: atLimit ? 'not-allowed' : 'pointer' }}>
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {/* Limit bar */}
      <div style={{ background: atLimit ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (atLimit ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {atLimit ? <AlertCircle size={13} color="#f87171" /> : <Crown size={13} color="rgba(255,255,255,0.3)" />}
        <span style={{ fontSize: '12px', color: atLimit ? '#f87171' : 'rgba(255,255,255,0.45)' }}>
          {atLimit
            ? `Limite atteinte — ${limits.maxLinks} liens max pour l'offre ${limits.label}`
            : `${links.length} / ${limits.maxLinks} liens utilisés`}
        </span>
        {atLimit && (
          <a href="/" style={{ marginLeft: 'auto', fontSize: '11px', color: '#ff8c00', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Upgrader →</a>
        )}
      </div>

      {/* Empty state */}
      {links.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '18px', padding: '48px 24px', textAlign: 'center' }}>
          <Link2 size={28} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 4px' }}>Aucune plateforme configurée</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: 0 }}>Cliquez sur Ajouter pour commencer</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '10px' }}>
          {links.map((link, i) => (
            <PlatformCard
              key={link.id || i}
              link={link} index={i}
              onUpdate={u => handleUpdateLink(i, u)}
              onRemove={() => handleRemoveLink(i)}
            />
          ))}
        </div>
      )}

      <AddPlatformDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSelect={handleAddPlatform}
        existingPlatforms={links.map(l => l.platform)}
      />
    </div>
  );
}
