import React, { useState, useCallback, useRef } from 'react';
import { Plus, Link2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlatformCard from '@/components/dashboard/PlatformCard';
import AddPlatformDialog from '@/components/dashboard/AddPlatformDialog';
import { LINKS_PER_PAGE } from '../../constants/limits';

export default function PlatformsPanel({ localProfile, updateLocal, showAddDialog, setShowAddDialog }) {
  const [linksPage, setLinksPage] = useState(0);
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const links = localProfile?.links || [];
  const pagedLinks = links.slice(linksPage * LINKS_PER_PAGE, (linksPage + 1) * LINKS_PER_PAGE);
  const totalLinkPages = Math.ceil(links.length / LINKS_PER_PAGE);

  /* ── Drag & drop ── */
  const handleDragStart = useCallback((e, idx) => {
    dragIndexRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.currentTarget) e.currentTarget.style.opacity = '0.4'; }, 0);
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(idx);
  }, []);

  const handleDrop = useCallback((e, toIdx) => {
    e.preventDefault();
    const fromIdx = dragIndexRef.current;
    if (fromIdx === null || fromIdx === toIdx) { setDragOverIndex(null); return; }
    const newLinks = [...(localProfile?.links || [])];
    const [moved] = newLinks.splice(fromIdx, 1);
    newLinks.splice(toIdx, 0, moved);
    updateLocal({ links: newLinks });
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }, [localProfile, updateLocal]);

  const handleUpdateLink = useCallback((index, updated) => {
    const l = [...(localProfile?.links || [])];
    l[index] = updated;
    updateLocal({ links: l });
  }, [localProfile, updateLocal]);

  const handleRemoveLink = useCallback((index) => {
    const l = (localProfile?.links || []).filter((_, i) => i !== index);
    updateLocal({ links: l });
    setLinksPage(p => Math.min(p, Math.max(0, Math.ceil(l.length / LINKS_PER_PAGE) - 1)));
  }, [localProfile, updateLocal]);

  const handleAddPlatform = (key) => {
    updateLocal({ links: [...(localProfile?.links || []), { id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }] });
    setShowAddDialog(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Mes plateformes</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            {links.length} lien(s) configuré(s)
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {links.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '18px', padding: '48px 24px', textAlign: 'center' }}>
          <Link2 size={28} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Aucune plateforme configurée</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: '4px 0 0' }}>Cliquez sur Ajouter pour commencer</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '10px' }}>
            {pagedLinks.map((link, i) => {
              const absoluteIndex = linksPage * LINKS_PER_PAGE + i;
              const isDragOver = dragOverIndex === absoluteIndex;
              return (
                <div key={link.id || link.platform + '-' + absoluteIndex}
                  draggable
                  onDragStart={e => handleDragStart(e, absoluteIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => handleDragOver(e, absoluteIndex)}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={e => handleDrop(e, absoluteIndex)}
                  style={{ position: 'relative', transition: 'transform 0.15s', transform: isDragOver ? 'scale(1.02)' : 'scale(1)', outline: isDragOver ? '2px dashed rgba(255,255,255,0.5)' : '2px solid transparent', borderRadius: '16px', cursor: 'grab' }}>
                  {links.length > 1 && (
                    <div style={{ position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', zIndex: 2, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
                      <GripVertical size={14} />
                    </div>
                  )}
                  <PlatformCard
                    link={link}
                    index={absoluteIndex}
                    onUpdate={u => handleUpdateLink(absoluteIndex, u)}
                    onRemove={() => handleRemoveLink(absoluteIndex)}
                  />
                </div>
              );
            })}
          </div>

          {totalLinkPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <button disabled={linksPage === 0} onClick={() => setLinksPage(p => p - 1)}
                style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', opacity: linksPage === 0 ? 0.3 : 1 }}>
                Précédent
              </button>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{linksPage + 1} / {totalLinkPages}</span>
              <button disabled={linksPage >= totalLinkPages - 1} onClick={() => setLinksPage(p => p + 1)}
                style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', opacity: linksPage >= totalLinkPages - 1 ? 0.3 : 1 }}>
                Suivant
              </button>
            </div>
          )}
        </>
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
