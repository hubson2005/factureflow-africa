import React from "react";
import { Bell, Check, CheckCheck, Loader2, AlertCircle, ClipboardCheck, Mail, FileText } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../modules/notifications/useNotifications";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const TYPE_ICONS = {
  nouvelle_facture: FileText,
  nouveau_paiement: Mail,
  nouveau_devis: FileText,
  depense_importante: AlertCircle,
  client_inactif: AlertCircle,
  seuil_tresorerie: AlertCircle,
  tache: ClipboardCheck,
};

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return diffMin + " min";
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return diffH + " h";
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 7) return diffJ + " j";
  return d.toLocaleDateString("fr-FR");
}

export default function Notifications() {
  const { data: notifications, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = (notifications || []).filter((item) => !item.is_read).length;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <Header title="Notifications" />
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: colors.white, color: colors.gray[700],
              border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 700,
              cursor: markAllRead.isPending ? "not-allowed" : "pointer", fontFamily: font, flexShrink: 0,
            }}
          >
            {markAllRead.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
            Tout marquer comme lu
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {(!notifications || notifications.length === 0) ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: colors.gray[600] }}>
              <Bell size={28} color={colors.gray[300]} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13 }}>Aucune notification pour le moment.</p>
            </div>
          ) : notifications.map((item) => {
            const Icon = TYPE_ICONS[item.type] || Bell;
            return (
              <div
                key={item.id}
                onClick={() => !item.is_read && markRead.mutate(item.id)}
                className="ff-card"
                style={{
                  background: item.is_read ? colors.white : palette.primary[50],
                  borderRadius: radius.lg, padding: 14,
                  border: "1px solid " + (item.is_read ? colors.gray[100] : palette.primary[100]),
                  boxShadow: shadow.card, display: "flex", alignItems: "flex-start", gap: 12,
                  cursor: item.is_read ? "default" : "pointer",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: radius.md,
                  background: item.is_read ? colors.gray[50] : colors.white,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={16} color={item.is_read ? colors.gray[400] : palette.primary.solid} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: item.is_read ? 600 : 700, color: colors.gray[900] }}>
                      {item.title}
                    </p>
                    <span style={{ fontSize: 11, color: colors.gray[400], flexShrink: 0 }}>{formatDate(item.created_at)}</span>
                  </div>
                  {item.message && (
                    <p style={{ margin: "3px 0 0", fontSize: 12.5, color: colors.gray[600], lineHeight: "18px" }}>
                      {item.message}
                    </p>
                  )}
                </div>
                {!item.is_read && (
                  <div style={{ display: "flex", alignItems: "center", flexShrink: 0, paddingTop: 2 }} title="Marquer comme lu">
                    <Check size={14} color={palette.primary.solid} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

