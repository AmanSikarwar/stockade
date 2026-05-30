import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Icon } from "../icons/Icon";

const NotificationContext = createContext(null);

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
      <div className="notifications" aria-live="polite" aria-relevant="additions text">
        {notifications.map((notification) => (
          <article
            className={`notification notification-${notification.tone}`}
            key={notification.id}
          >
            <Icon name={notification.tone === "success" ? "check" : "info"} size={18} />
            <div>
              {notification.title ? <strong>{notification.title}</strong> : null}
              <p>{notification.message}</p>
            </div>
            <button
              aria-label="Dismiss notification"
              className="icon-button"
              onClick={() => dismiss(notification.id)}
              type="button"
            >
              <Icon name="close" size={16} />
            </button>
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
