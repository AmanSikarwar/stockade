import { describe, expect, it } from "vitest";

import { getTokenExpiry, isSessionExpired } from "./session";

function makeToken(payload) {
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  return `header.${body}.sig`;
}

describe("isSessionExpired", () => {
  it("is expired when there is no token", () => {
    expect(isSessionExpired(null)).toBe(true);
    expect(isSessionExpired({ expiresAt: Date.now() + 100000 })).toBe(true);
  });

  it("is expired when past expiry", () => {
    expect(isSessionExpired({ token: "t", expiresAt: Date.now() - 1000 })).toBe(true);
  });

  it("is valid well before expiry", () => {
    expect(isSessionExpired({ token: "t", expiresAt: Date.now() + 3_600_000 })).toBe(false);
  });
});

describe("getTokenExpiry", () => {
  it("prefers the JWT exp claim", () => {
    const exp = Math.floor(Date.now() / 1000) + 1800;
    expect(getTokenExpiry(makeToken({ exp }), 3600)).toBe(exp * 1000);
  });

  it("falls back to expires_in when exp is absent", () => {
    const before = Date.now();
    const result = getTokenExpiry(makeToken({ sub: "x" }), 60);
    expect(result).toBeGreaterThanOrEqual(before + 60_000 - 50);
  });
});
