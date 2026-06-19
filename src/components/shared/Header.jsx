import { Eye, Save, LogOut, Bell, BellOff, Loader2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ThemeColorPicker from '../dashboard/ThemeColorPicker';

/**
 * Shared sticky top-bar for admin and user dashboards.
 */
export default function Header({
  title,
  isMobile,
  hasChanges,
  saving,
  onSave,
  onPreview,
  onSignOut,
  profile,
  onUpdate,
  badge,           // optional { label, color, emoji }
}) {
  const [showNotif,   setShowNotif]   = useState(false);
  const notifRef = useRef(null);
  const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(4,2,16,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: isMobile ? '10px 14px' : '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isMobile && <img src="/Logo_SocialApp.png" alt="" style={{ width: '26px', height: '26px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />}
        <h2 style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: 0 }}>{title || 'Dashboard'}</h2>
        {hasChanges && (
          <span style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', color: '#fbbf24', fontWeight: 600 }}>
            Non sauvegardé
          </span>
        )}
        {badge && (
          <span style={{ background: badge.color + '18', border: '1px solid ' + badge.color + '44', borderRadius: '6px', padding: '2px 7px', fontSize: '9px', color: badge.color, fontWeight: 700, letterSpacing: '0.06em' }}>
            {badge.emoji} {badge.label}
          </span>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {profile && onUpdate && <ThemeColorPicker profile={profile} onUpdate={onUpdate} />}

        {onPreview && (
          <button onClick={onPreview} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9px', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            <Eye size={13} />{!isMobile && 'Aperçu'}
          </button>
        )}

        {/* Notif button */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowNotif(v => !v)} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: notifGranted ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.07)', border: '1px solid ' + (notifGranted ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'), borderRadius: '9px', cursor: 'pointer' }}>
            {notifGranted ? <Bell size={14} color="#22c55e" /> : <BellOff size={14} color="rgba(255,255,255,0.5)" />}
          </button>
          <AnimatePresence>
            {showNotif && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'rgba(10,8,25,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '18px', minWidth: '260px', zIndex: 50, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>Notifications push</span>
                  <button onClick={() => setShowNotif(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                </div>
                {!notifGranted
                  ? <button onClick={async () => { const p = await Notification.requestPermission(); if (p === 'granted') { toast.success('Notifications activées !'); setShowNotif(false); } }} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>🔔 Activer les notifications</button>
                  : <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, textAlign: 'center' }}>✅ Notifications actives</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save */}
        <button onClick={onSave} disabled={!hasChanges || saving}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: hasChanges ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)', border: '1px solid ' + (hasChanges ? 'transparent' : 'rgba(255,255,255,0.12)'), borderRadius: '9px', color: hasChanges ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, cursor: hasChanges ? 'pointer' : 'default', opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {!isMobile && 'Sauvegarder'}
        </button>

        {/* Sign out */}
        <button onClick={onSignOut} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9px', cursor: 'pointer' }}>
          <LogOut size={14} color="rgba(255,255,255,0.5)" />
        </button>
      </div>
    </div>
  );
}
