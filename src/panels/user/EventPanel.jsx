import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ImagePlus, Video, Palette, MapPin, Lock, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabase';
import EventMediaCarousel from '../../components/user/EventMediaCarousel';
import { isVideoUrl } from '../../utils/helpers';
import { MAX_SIZE_KB, MAX_VIDEO_SIZE_KB } from '../../constants/limits';

const EVENT_COLOR_PRESETS = [
  { c1: '#ff6b35', c2: '#f7c948' },
  { c1: '#0ea5e9', c2: '#6366f1' },
  { c1: '#10b981', c2: '#065f46' },
  { c1: '#ec4899', c2: '#8b5cf6' },
  { c1: '#1e1b4b', c2: '#312e81' },
  { c1: '#ef4444', c2: '#b91c1c' },
];

export default function EventPanel({ localProfile, updateLocal, isActivated }) {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [thumbIndex,     setThumbIndex]     = useState(0);

  const eventMedias = Array.isArray(localProfile.event_images)
    ? localProfile.event_images
    : localProfile.event_image_url ? [localProfile.event_image_url] : [];

  const videoCount = eventMedias.filter(u => isVideoUrl(typeof u === 'string' ? u : u?.url)).length;
  const imgCount   = eventMedias.length - videoCount;

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    for (const file of files) {
      const isVid = file.type.startsWith('video/');
      const limit = isVid ? MAX_VIDEO_SIZE_KB : MAX_SIZE_KB;
      if (file.size / 1024 > limit) {
        toast.error(`${file.name} dépasse ${isVid ? '50 Mo' : '2 Mo'}`);
        e.target.value = '';
        return;
      }
    }
    setUploadingMedia(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const isVid = file.type.startsWith('video/');
        const pre   = isVid ? 'event-video' : 'event-img';
        const ext   = file.name.split('.').pop();
        const name  = `${pre}-${localProfile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(name, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('avatars').getPublicUrl(name);
        return data.publicUrl;
      }));
      const merged = [...eventMedias, ...urls];
      updateLocal({ event_images: merged, event_image_url: merged[0] });
      toast.success(urls.length + ' fichier(s) ajouté(s) !');
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (idx) => {
    const updated = eventMedias.filter((_, i) => i !== idx);
    updateLocal({ event_images: updated, event_image_url: updated[0] || null });
    setThumbIndex(prev => Math.min(prev, Math.max(0, updated.length - 1)));
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
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            Ajoutez des images ou vidéos de votre événement
          </p>
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
            {isActivated ? (
              <>
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
              </>
            ) : (
              <>
                {["Nom de l'événement","Date & heure","Lieu","Description / programme","Lien de réservation"].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px 12px', border: '1px dashed rgba(255,255,255,0.1)', opacity: 0.55 }}>
                    <Lock size={12} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.2)', borderRadius: '10px', padding: '8px 12px' }}>
                  <Lock size={12} color="#60a5fa" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#93c5fd', fontSize: '11px' }}>Ces champs seront accessibles après activation de votre compte.</span>
                </div>
              </>
            )}
          </div>

          {/* Color presets (activated only) */}
          {isActivated && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Palette size={14} color="rgba(255,255,255,0.4)" />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>Couleurs</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {EVENT_COLOR_PRESETS.map((p, i) => (
                  <button key={i} onClick={() => updateLocal({ event_color1: p.c1, event_color2: p.c2 })}
                    style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg,${p.c1},${p.c2})`, border: localProfile.event_color1 === p.c1 ? '3px solid white' : '3px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>
            </div>
          )}

          {/* Media upload */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImagePlus size={14} color="rgba(255,255,255,0.5)" />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>Médias</span>
                {imgCount   > 0 && <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '1px 6px', fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>🖼 {imgCount}</span>}
                {videoCount > 0 && <span style={{ background: 'rgba(99,102,241,0.3)', borderRadius: '6px', padding: '1px 6px', fontSize: '10px', color: '#a5b4fc', fontWeight: 600 }}>▶ {videoCount}</span>}
              </div>
              {eventMedias.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', color: 'rgba(180,170,255,0.9)', fontSize: '12px', fontWeight: 600 }}>
                  {uploadingMedia ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Ajouter
                  <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/mov,video/quicktime" multiple className="hidden" onChange={handleMediaUpload} disabled={uploadingMedia} />
                </label>
              )}
            </div>

            {eventMedias.length > 0 ? (
              <>
                <EventMediaCarousel medias={eventMedias} onRemove={handleRemoveMedia} adminMode />
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {eventMedias.map((m, i) => {
                    const url = typeof m === 'string' ? m : m?.url;
                    return (
                      <div key={i} onClick={() => setThumbIndex(i)}
                        style={{ width: '46px', height: '36px', borderRadius: '7px', overflow: 'hidden', border: i === thumbIndex ? '2px solid white' : '2px solid transparent', cursor: 'pointer', flexShrink: 0, background: '#000' }}>
                        {isVideoUrl(url) ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.35)', gap: '1px' }}>
                            <span style={{ fontSize: '10px', color: 'white' }}>▶</span>
                            <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>vidéo</span>
                          </div>
                        ) : (
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px', padding: '28px', cursor: 'pointer' }}>
                {uploadingMedia ? (
                  <Loader2 size={20} color="rgba(99,102,241,0.8)" className="animate-spin" />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <ImagePlus size={15} color="rgba(255,255,255,0.4)" />
                    <Video      size={15} color="rgba(99,102,241,0.7)" />
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>
                    {uploadingMedia ? 'Upload en cours...' : 'Images ou vidéos'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>Images &lt; 2 Mo · Vidéos &lt; 50 Mo</p>
                </div>
                <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/mov,video/quicktime" multiple className="hidden" onChange={handleMediaUpload} disabled={uploadingMedia} />
              </label>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
