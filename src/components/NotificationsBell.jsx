import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, CheckCheck, Receipt, Clock, FileCheck2, Wallet } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

const TYPE_ICONS = {
  facture_payee: { icon: Receipt, color: '#22c55e' },
  facture_en_retard: { icon: Clock, color: '#ef4444' },
  devis_accepte: { icon: FileCheck2, color: '#3b82f6' },
  paiement_recu: { icon: Wallet, color: '#a78bfa' },
};

export default function NotificationsBell() {
  const { company, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!company) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setNotifications(data || []);
    setUnreadCount((data || []).filter((n) => !n.is_read).length);
  }, [company]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notif) => {
    if (notif.is_read || notif.user_id !== user.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .eq('is_read', false);
    loadNotifications();
  };

  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <button onClick={() => setOpen((o) => !o)} style={styles.bellBtn}>
        <Bell size={18} color="#aab2c5" />
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span style={styles.dropdownTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={styles.markAllBtn}>
                <CheckCheck size={13} /> Tout marquer lu
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>Aucune notification pour le moment.</div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_ICONS[n.type] || { icon: Bell, color: '#8b93a7' };
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleMarkAsRead(n)}
                    style={{ ...styles.item, opacity: n.is_read ? 0.55 : 1 }}
                  >
                    <div style={{ ...styles.itemIcon, color: meta.color, background: `${meta.color}1a` }}>
                      <Icon size={14} />
                    </div>
                    <div style={styles.itemBody}>
                      <div style={styles.itemTitle}>{n.title}</div>
                      <div style={styles.itemMessage}>{n.message}</div>
                      <div style={styles.itemTime}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <span style={styles.unreadDot} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative' },
  bellBtn: {
    position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2940',
    borderRadius: 10, padding: 9, cursor: 'pointer', display: 'flex',
  },
  badge: {
    position: 'absolute', top: -5, right: -5,
    background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
    borderRadius: 100, minWidth: 17, height: 17, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '0 3px',
  },
  dropdown: {
    position: 'absolute', top: '110%', right: 0, width: 340,
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 14,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #1f2940',
  },
  dropdownTitle: { color: '#fff', fontSize: 14, fontWeight: 700 },
  markAllBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'none', border: 'none', color: '#22c55e', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  },
  list: { maxHeight: 360, overflowY: 'auto' },
  emptyState: { padding: '32px 16px', textAlign: 'center', color: '#5f6878', fontSize: 13 },
  item: {
    display: 'flex', gap: 11, width: '100%', textAlign: 'left',
    background: 'none', border: 'none', borderBottom: '1px solid #1a2238',
    padding: '12px 16px', cursor: 'pointer', position: 'relative',
  },
  itemIcon: {
    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { color: '#fff', fontSize: 12.5, fontWeight: 600 },
  itemMessage: { color: '#8b93a7', fontSize: 11.5, marginTop: 2, lineHeight: 1.4 },
  itemTime: { color: '#5f6878', fontSize: 10.5, marginTop: 4 },
  unreadDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
    flexShrink: 0, marginTop: 4,
  },
};