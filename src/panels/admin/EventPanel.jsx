import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ImagePlus, Palette, MapPin, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabase';
import { EVENT_COLOR_PRESETS } from '../../constants/adminNav';
import { MAX_SIZE_KB } from '../../constants/limits';

export default function EventPanel({ localProfile, updateLocal }) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const eventImages = Array.isArray(localProfile.event_images)
    ? localProfile.event_images
    : localProfile.event_image_url ? [localProfile.event_image_url] : [];

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const oversized = files.find(f => f.size / 1024 > MAX_SIZE_KB);
    if (oversized) { toast.error(oversized.name + ' dépasse 2 Mo'); return; }
    setUploadingImages(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const fileName = `event-${localProfile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
      }));
      const merged = [...eventImages, ...urls];
      updateLocal({ event_images: merged, event_image_url: merged[0] });
      toast.success(urls.length + ' image(s) ajoutée(s) !');
    } catch (err) {
      toast.error('Erreur upload : ' + err.message);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (idx) => {
    const updated = eventImages.filter((_, i) => i !== idx);
    updateLocal({ event_images: updated, event_image_url: updated[0] || null });
  };

  const inputStyle = {
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px' }}>
      {/* Header + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Mode Événement</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>Compte à rebours et détails de l'événement</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: localProfile.is_event ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>
            {localProfile.is_event ? 'Activé' : 'Désactivé'}
          </span>
          <button onClick={() => updateLocal({ is_event: !localProfile.is_event })}
            style={{ width: '44px', height: '24px', borderRadius: '100px', background: localProfile.is_event ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: localProfile.is_event ? '23px' : '3px', transition: 'left 0.3s' }} />
          </button>
        </div>
      </div>

      {localProfile.is_event && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Fields */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" value={localProfile.event_name || ''} onChange={e => updateLocal({ event_name: e.target.value })} placeholder="Nom de l'événement" style={inputStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="datetime-local" value={localProfile.event_date || ''} onChange={e => updateLocal({ event_date: e.target.value })} style={inputStyle} />
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="rgba(255,255,255,0.3)" />
                <input type="text" value={localProfile.event_location || ''} onChange={e => updateLocal({ event_location: e.target.value })} placeholder="Lieu" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none', flex: 1 }} />
              </div>
            </div>
            <textarea value={localProfile.event_description || ''} onChange={e => updateLocal({ event_description: e.target.value })} placeholder="Description…" rows={3} style={{ ...inputStyle, resize: 'none' }} />
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🎟️</span>
              <input type="url" value={localProfile.event_booking_url || ''} onChange={e => updateLocal({ event_booking_url: e.target.value })} placeholder="Lien réservation" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none', flex: 1 }} />
            </div>
          </div>

          {/* Color presets */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Palette size={14} color="rgba(255,255,255,0.4)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>Couleurs de l'événement</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EVENT_COLOR_PRESETS.map(preset => (
                <button key={preset.label} onClick={() => updateLocal({ event_color1: preset.c1, event_color2: preset.c2 })} title={preset.label}
                  style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg,${preset.c1},${preset.c2})`, border: localProfile.event_color1 === preset.c1 ? '3px solid white' : '3px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
              ))}
            </div>
          </div>

          {/* Images */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImagePlus size={14} color="rgba(255,255,255,0.4)" />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>
                  Images {eventImages.length > 0 && `(${eventImages.length})`}
                </span>
              </div>
              {eventImages.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', color: '#a78bfa', fontSize: '12px', fontWeight: 600 }}>
                  {uploadingImages ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Ajouter
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} disabled={uploadingImages} />
                </label>
              )}
            </div>

            {eventImages.length === 0 ? (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px', padding: '28px', cursor: 'pointer' }}>
                {uploadingImages ? <Loader2 size={20} color="rgba(99,102,241,0.8)" className="animate-spin" /> : <ImagePlus size={20} color="rgba(255,255,255,0.25)" />}
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  {uploadingImages ? 'Upload…' : 'Ajouter des images'}
                </span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} disabled={uploadingImages} />
              </label>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '8px' }}>
                {eventImages.map((url, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={typeof url === 'string' ? url : url?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => handleRemoveImage(i)}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={11} color="white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
