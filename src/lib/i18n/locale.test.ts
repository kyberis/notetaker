import { describe, expect, it } from "vitest";

import { isLocale, isRtl, normalizeLocale, pickFromAcceptLanguage } from "./locale";

describe("locale primitives", () => {
  it("isLocale only accepts known values", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("normalizeLocale matches by prefix", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("es-AR")).toBe("es");
    expect(normalizeLocale("pt-BR")).toBe("pt");
    expect(normalizeLocale("ar-EG")).toBe("ar");
    expect(normalizeLocale("zh")).toBe("en");
  });

  it("isRtl is true only for arabic", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });

  it("pickFromAcceptLanguage respects q-values", () => {
    expect(pickFromAcceptLanguage("fr;q=0.9, en-US;q=0.8")).toBe("en");
    expect(pickFromAcceptLanguage("ar-EG, en;q=0.5")).toBe("ar");
    expect(pickFromAcceptLanguage(null)).toBe("en");
  });
});
