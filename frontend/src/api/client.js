const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const apiBaseUrl = rawApiBaseUrl.trim().replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getApiBaseUrl() {
  return apiBaseUrl || "same origin";
}

export async function apiRequest(
  path,
  { method = "GET", token, body, signal, onUnauthorized } = {},
) {
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: buildHeaders({ token, body }),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const payload = await parseResponseBody(response);

  if (response.status === 401) {
    onUnauthorized?.();
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.status), {
      status: response.status,
      detail: payload?.detail ?? payload,
    });
  }

  return payload;
}

function buildApiUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

function buildHeaders({ token, body }) {
  const headers = new Headers({ Accept: "application/json" });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload, status) {
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }

  if (typeof payload?.detail === "string") {
    return payload.detail;
  }

  if (payload?.detail?.message) {
    return payload.detail.message;
  }

  return `Request failed with status ${status}`;
}
