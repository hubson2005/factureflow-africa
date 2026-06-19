import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useWindowWidth }  from '../hooks/useWindowWidth';
import { parseColors }     from '../utils/parseColors';
import { SIDEBAR_NAV }     from '../constants/adminNav';
import Sidebar             from '../components/admin/Sidebar';
import Header              from '../components/shared/Header';
import MobileNav           from '../components/dashboard/MobileNav';
import ProfilePreview      from '../components/dashboard/ProfilePreview';
import TemplatesModal      from '../components/admin/TemplatesModal';

/**
 * Shell layout for the admin dashboard.
 * Handles sidebar, topbar, mobile nav, preview modal,
 * templates modal, and push-notification subscription.
 *
 * The actual section content is rendered via `children` or
 * by passing a `renderSection` render-prop.
 */
export default function AdminLayout({
  activeSection,
  onNavigate,
  profiles,
  activeProfileId,
  localProfile,
  hasChanges,
  saving,
  onSave,
  onSignOut,
  onUpdate,
  renderSection,
  showTemplates,
  onCloseTemplates,
  onApplyTemplate,
}) {
  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth < 768;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showPreview,      setShowPreview]       = useState(false);
  const [showNotifPanel,   setShowNotifPanel]    = useState(false);
  const notifPanelRef  = useRef(null);
  const notifCountRef  = useRef(0);
  const notifThreshold = parseInt(localStorage.getItem('notif_threshold') || '10');

  // Auto-collapse sidebar on mobile
  useEffect(() => { setSidebarCollapsed(isMobile); }, [isMobile]);

  // Close notif panel on outside click
  useEffect(() => {
    const h = (e) => { if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) setShowNotifPanel(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Background style
  const colors  = localProfile ? parseColors(localProfile.theme_color) : { bg1: '#0f0a1e', bg2: '#2d1b69' };
  const bgStyle = localProfile?.bg_image_url
    ? { backgroundImage: `url(${localProfile.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : { background: `linear-gradient(135deg,${colors.bg1} 0%,${colors.bg2} 100%)` };

  const currentNav = SIDEBAR_NAV.find(n => n.id === activeSection);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', ...bgStyle, position: 'relative' }}>
      {localProfile?.bg_image_url && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
      )}

      {/* ── Sidebar ── */}
      <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, width: isMobile ? 0 : undefined }}>
        <Sidebar
          activeSection={activeSection}
          onNavigate={onNavigate}
          profiles={profiles}
          activeProfileId={activeProfileId}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
          isMobile={isMobile}
        />
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>

        {/* Top bar */}
        <Header
          title={currentNav?.label || 'Dashboard'}
          isMobile={isMobile}
          hasChanges={hasChanges}
          saving={saving}
          onSave={onSave}
          onPreview={() => setShowPreview(true)}
          onSignOut={onSignOut}
          profile={localProfile}
          onUpdate={onUpdate}
        />

        {/* Section content */}
        <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', paddingBottom: isMobile ? '100px' : '24px', overflowY: 'auto', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {renderSection?.()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile bottom nav */}
        {isMobile && (
          <MobileNav
            activeSection={activeSection}
            onNavigate={onNavigate}
            profile={localProfile}
          />
        )}
      </div>

      {/* Preview modal */}
      {showPreview && localProfile && (
        <ProfilePreview profile={localProfile} onClose={() => setShowPreview(false)} />
      )}

      {/* Templates modal */}
      <AnimatePresence>
        {showTemplates && (
          <TemplatesModal onClose={onCloseTemplates} onApply={onApplyTemplate} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.3} }
        * { scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent; }
        *::-webkit-scrollbar { width:5px; height:5px; }
        *::-webkit-scrollbar-track { background:transparent; }
        *::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:10px; }
      `}</style>
    </div>
  );
}
