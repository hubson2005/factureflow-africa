import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindowWidth }  from '../hooks/useWindowWidth';
import { parseColors }     from '../utils/parseColors';
import { USER_NAV }        from '../constants/userPlan';
import UserSidebar         from '../components/user/UserSidebar';
import Header              from '../components/shared/Header';
import MobileNav           from '../components/dashboard/MobileNav';
import ProfilePreview      from '../components/dashboard/ProfilePreview';

/**
 * Shell layout for the user dashboard.
 * Adapts the background to the profile's theme_color or bg_image_url,
 * and wires sidebar / topbar / mobile nav.
 */
export default function UserLayout({
  activeSection,
  onNavigate,
  localProfile,
  plan,
  limits,
  hasChanges,
  saving,
  onSave,
  onSignOut,
  onUpdate,
  renderSection,
}) {
  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth < 768;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showPreview,      setShowPreview]       = useState(false);

  // Auto-collapse on mobile
  useEffect(() => { setSidebarCollapsed(isMobile); }, [isMobile]);

  // Apply background to <html> element so it fills the whole viewport
  useEffect(() => {
    if (!localProfile) return;
    const html = document.documentElement;
    if (localProfile.bg_image_url) {
      Object.assign(html.style, {
        backgroundImage:      `url(${localProfile.bg_image_url})`,
        backgroundSize:       'cover',
        backgroundPosition:   'center',
        backgroundRepeat:     'no-repeat',
        backgroundAttachment: 'fixed',
      });
    } else {
      const { bg1, bg2 } = parseColors(localProfile.theme_color);
      html.style.backgroundImage = 'none';
      html.style.background      = `linear-gradient(160deg,${bg1},${bg2})`;
    }
    return () => {
      ['backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','backgroundAttachment','background']
        .forEach(k => { html.style[k] = ''; });
    };
  }, [localProfile]);

  const currentNav = USER_NAV.find(n => n.id === activeSection);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>

      {/* ── Sidebar ── */}
      <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, width: isMobile ? 0 : undefined }}>
        <UserSidebar
          activeSection={activeSection}
          onNavigate={onNavigate}
          profile={localProfile}
          plan={plan}
          limits={limits}
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
          badge={limits ? { label: limits.label, color: limits.color, emoji: limits.emoji } : null}
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
