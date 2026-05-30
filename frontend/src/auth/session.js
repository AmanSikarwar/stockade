const STORAGE_KEY = "stockade.auth";
const EXPIRY_SKEW_MS = 5_000;

export function loadSession() {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }

    const session = JSON.parse(value);
    if (isSessionExpired(session)) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getTokenExpiry(accessToken, expiresIn) {
  const payload = decodeJwtPayload(accessToken);

  if (Number.isFinite(payload?.exp)) {
    return payload.exp * 1000;
  }

  return Date.now() + expiresIn * 1000;
}

export function isSessionExpired(session) {
  return (
    !session?.token ||
    !Number.isFinite(session.expiresAt) ||
    Date.now() + EXPIRY_SKEW_MS >= session.expiresAt
  );
}

function decodeJwtPayload(accessToken) {
  const [, encodedPayload] = accessToken.split(".");
  if (!encodedPayload) {
    return null;
  }

  try {
    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    );
    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
}
