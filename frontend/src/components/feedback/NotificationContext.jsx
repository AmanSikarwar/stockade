import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Icon } from "../icons/Icon";
import { IconButton } from "../ui/IconButton";

const NotificationContext = createContext(null);

const toneIcon = {
  danger: "outStock",
  info: "info",
  success: "inStock",
  warning: "lowStock",
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((items) => items.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    ({ message, title, tone = "info" }) => {
      const id = crypto.randomUUID();
      setNotifications((items) => [...items, { id, message, title, tone }]);
      window.setTimeout(() => dismiss(id), 5_000);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ dismiss, notify }), [dismiss, notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" aria-relevant="additions text">
        {notifications.map((notification) => (
          <article className={`toast tone-${notification.tone}`} key={notification.id}>
            <Icon
              name={toneIcon[notification.tone] ?? "info"}
              size={20}
              stroke={2}
              className="toast-ico"
            />
            <div className="toast-body">
              {notification.title ? <strong>{notification.title}</strong> : null}
              <p>{notification.message}</p>
            </div>
            <IconButton
              icon="close"
              label="Dismiss notification"
              size="sm"
              onClick={() => dismiss(notification.id)}
            />
          </article>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return value;
}
