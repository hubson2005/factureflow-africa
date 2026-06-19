import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { isVideoUrl } from '../../utils/isVideoUrl';

export default function EventMediaCarousel({ medias = [], onRemove, adminMode = false }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  const urls = medias.map(m => (typeof m === 'string' ? m : m?.url)).filter(Boolean);
  const currentUrl = urls[current];
  const isVid = isVideoUrl(currentUrl);

  useEffect(() => { setCurrent(0); }, [urls.length]);

  useEffect(() => {
    if (urls.length <= 1 || isVid) return;
    intervalRef.current = setInterval(() => setCurrent(p => (p + 1) % urls.length), 3500);
    return () => clearInterval(intervalRef.current);
  }, [urls.length, isVid]);

  const goTo = (idx) => {
    clearInterval(intervalRef.current);
    setCurrent(idx);
    if (!isVideoUrl(urls[idx]))
      intervalRef.current = setInterval(() => setCurrent(p => (p + 1) % urls.length), 3500);
  };

  if (!urls.length) return null;

  return (
    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      <AnimatePresence mode="wait">
        {isVid
          ? <motion.video key={current} src={currentUrl} controls muted loop playsInline initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
          : <motion.img   key={current} src={currentUrl} alt=""  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
        }
      </AnimatePresence>

      {isVid && <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(99,102,241,0.85)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', color: 'white', fontWeight: 700 }}>▶ Vidéo</div>}
      {urls.length > 1 && <div style={{ position: 'absolute', top: '8px', right: adminMode ? '44px' : '8px', background: 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: 'white', fontWeight: 600 }}>{current + 1}/{urls.length}</div>}

      {adminMode && onRemove && (
        <button type="button" onClick={() => onRemove(current)} style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={13} color="white" />
        </button>
      )}

      {urls.length > 1 && (
        <>
          <button type="button" onClick={() => goTo((current - 1 + urls.length) % urls.length)} style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={15} color="white" /></button>
          <button type="button" onClick={() => goTo((current + 1) % urls.length)}              style={{ position: 'absolute', right: adminMode ? '40px' : '6px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={15} color="white" /></button>
        </>
      )}

      {/* Dot indicators */}
      {urls.length > 1 && (
        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
          {urls.map((u, i) => (
            <button key={i} type="button" onClick={() => goTo(i)}
              style={{ width: i === current ? '16px' : '5px', height: '5px', borderRadius: '3px', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s', background: isVideoUrl(u) ? (i === current ? '#a5b4fc' : 'rgba(165,180,252,0.4)') : (i === current ? 'white' : 'rgba(255,255,255,0.4)') }} />
          ))}
        </div>
      )}
    </div>
  );
}
