import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, Receipt,
  Wallet, UserCog, Settings as SettingsIcon, LogOut, Building2,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { NAVIGATION } from '../constants/navigation';
import NotificationsBell from './NotificationsBell';

// Icônes et restrictions par rôle pour chaque item de NAVIGATION.
// "allow: null" = visible pour tous les rôles connectés à une entreprise.
const NAV_META = {
  dashboard: { icon: LayoutDashboard, path: '/dashboard', allow: null },
  clients: { icon: Users, path: '/clients', allow: null },
  products: { icon: Package, path: '/products', allow: null },
  quotes: { icon: FileText, path: '/quotes', allow: null },
  invoices: { icon: Receipt, path: '/invoices', allow: null },
  payments: { icon: Wallet, path: '/payments', allow: null },
  team: { icon: UserCog, path: '/team', allow: ['admin'] },
  settings: { icon: SettingsIcon, path: '/settings', allow: ['admin'] },
};

const ROLE_LABELS = {
  admin: 'Administrateur',
  manager: 'Manager',
  comptable: 'Comptable',
};

export default function Layout({ children }) {
  const { user, company, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleItems = NAVIGATION.filter((item) => {
    const meta = NAV_META[item.id];
    if (!meta) return false;
    if (!meta.allow) return true;
    return meta.allow.includes(role);
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.logoBlock}>
          <div style={styles.logoBadge}>F</div>
          <span style={styles.logoText}>FactureFlow</span>
        </div>

        <nav style={styles.nav}>
          {visibleItems.map((item) => {
            const meta = NAV_META[item.id];
            const Icon = meta.icon;
            const active = location.pathname === meta.path;
            return (
              <Link
                key={item.id}
                to={meta.path}
                style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.companyBox}>
            <Building2 size={14} color="#8b93a7" />
            <span style={styles.companyName}>{company?.name || '—'}</span>
          </div>
          <div style={styles.userBox}>
            <div style={styles.avatar}>
              {(user?.email?.[0] || '?').toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userEmail}>{user?.email}</span>
              <span style={styles.userRole}>{ROLE_LABELS[role] || role}</span>
            </div>
          </div>
          <button onClick={handleSignOut} style={styles.logoutBtn}>
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <NotificationsBell />
        </div>
        {children}
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0a0e1a',
    fontFamily: "'Sora','Segoe UI',sans-serif",
  },
  sidebar: {
    width: 240,
    background: '#11172a',
    borderRight: '1px solid #1f2940',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 14px',
    flexShrink: 0,
  },
  logoBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 8px 22px',
  },
  logoBadge: {
    width: 30, height: 30, borderRadius: 9,
    background: '#22c55e', color: '#06150c',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 15,
  },
  logoText: {
    color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '10px 12px',
    borderRadius: 10,
    color: '#aab2c5',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
  },
  navItemActive: {
    background: 'rgba(34,197,94,0.12)',
    color: '#22c55e',
    fontWeight: 600,
  },
  sidebarFooter: {
    borderTop: '1px solid #1f2940',
    paddingTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  companyBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '0 8px',
  },
  companyName: {
    color: '#aab2c5',
    fontSize: 13,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 8px',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: '#1f2940', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userEmail: {
    color: '#fff', fontSize: 12.5, fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userRole: {
    color: '#8b93a7', fontSize: 11.5,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: '1px solid #1f2940',
    color: '#aab2c5',
    fontSize: 13,
    fontWeight: 600,
    padding: '9px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    width: '100%',
  },
  main: {
    flex: 1,
    padding: '20px 36px 28px',
    overflowY: 'auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
};