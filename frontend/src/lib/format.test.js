import { describe, expect, it } from "vitest";

import { formatCurrency, initialsOf } from "./format";

describe("formatCurrency", () => {
  it("formats numbers as Indian Rupee", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("₹");
    expect(result).toContain("1,234.50");
  });

  it("uses Indian digit grouping (lakhs)", () => {
    expect(formatCurrency(350000)).toContain("3,50,000.00");
  });

  it("returns the raw value when not finite", () => {
    expect(formatCurrency("not-a-number")).toBe("not-a-number");
    expect(formatCurrency(undefined)).toBe("");
  });
});

describe("initialsOf", () => {
  it("takes first + last initials for multi-word names", () => {
    expect(initialsOf("Mara Okonkwo")).toBe("MO");
  });

  it("takes the first two letters for a single name", () => {
    expect(initialsOf("Stockade")).toBe("ST");
  });

  it("falls back to ? for empty input", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf(null)).toBe("?");
  });
});
