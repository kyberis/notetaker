import { describe, expect, it } from "vitest";

import { buildTelegramDeepLink, generateTelegramLinkCode, TELEGRAM_DEEP_LINK_START_MAX_LEN } from "./link";

describe("telegram link", () => {
  it("generates a 16-char alphanumeric code", () => {
    const code = generateTelegramLinkCode();
    expect(code.length).toBe(16);
    expect(/^[A-Za-z0-9_-]+$/.test(code)).toBe(true);
    expect(code.length).toBeLessThanOrEqual(TELEGRAM_DEEP_LINK_START_MAX_LEN);
  });

  it("buildTelegramDeepLink fails without TELEGRAM_BOT_USERNAME", () => {
    const prev = process.env.TELEGRAM_BOT_USERNAME;
    delete process.env.TELEGRAM_BOT_USERNAME;
    expect(() => buildTelegramDeepLink("abc")).toThrow();
    if (prev !== undefined) process.env.TELEGRAM_BOT_USERNAME = prev;
  });

  it("buildTelegramDeepLink renders t.me URL", () => {
    process.env.TELEGRAM_BOT_USERNAME = "WillBot";
    expect(buildTelegramDeepLink("abc")).toBe("https://t.me/WillBot?start=abc");
    delete process.env.TELEGRAM_BOT_USERNAME;
  });
});
