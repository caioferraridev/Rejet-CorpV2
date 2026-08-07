import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBellOff } from "react-icons/fi";

import styles from "./NotificacoesPage.module.css";

import { Button, EmptyState, Loader } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import { listNotifications, markNotificationRead } from "../../services/notifications/notificationService";
import { useAuth } from "../../contexts/AuthContext";
import { timeAgo } from "../../utils/format";
import { NOTIFICATION_ICONS, type AppNotification } from "../../types/notification";

export default function NotificacoesPage() {
  const { user, profile } = useAuth();
  const profileId = profile?.id ?? user?.id ?? null;
  const { notifications, unreadCount, refresh, markAllRead } = useNotifications();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listNotifications(profileId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [profileId, notifications]);

  async function openNotification(notification: AppNotification) {
    if (!notification.read) {
      await markNotificationRead(notification.id).catch(() => undefined);
      void refresh();
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notificações</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Tudo em dia por aqui."}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <Loader text="Carregando notificações..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔕"
          title="Nenhuma notificação"
          description="Interesses, mensagens e atualizações de negociação aparecerão aqui."
        />
      ) : (
        <div className={styles.list}>
          {items.map((notification) => (
            <Link
              key={notification.id}
              to={notification.link ?? "#"}
              onClick={() => openNotification(notification)}
              className={`${styles.item} ${!notification.read ? styles.unread : ""}`}
            >
              <span className={styles.icon}>
                {NOTIFICATION_ICONS[notification.type]}
              </span>

              <div className={styles.body}>
                <span className={styles.itemTitle}>{notification.title}</span>
                {notification.message && (
                  <span className={styles.itemMsg}>{notification.message}</span>
                )}
                <span className={styles.time}>{timeAgo(notification.created_at)}</span>
              </div>

              {!notification.read && <span className={styles.dot} />}
            </Link>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className={styles.emptyIcon}>
          <FiBellOff size={40} />
        </div>
      )}
    </div>
  );
}
