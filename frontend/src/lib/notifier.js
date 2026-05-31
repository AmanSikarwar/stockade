// Bridges modules created outside React (the query client) to the in-app
// toast system. NotificationProvider registers its notify fn on mount.
let handler = null;

export function setGlobalNotifier(fn) {
  handler = fn;
}

export function notifyGlobal(payload) {
  handler?.(payload);
}
