"use client";

import { useCallback, useEffect, useState } from "react";

type Quota = {
  used: number;
  limit: number;
  remaining: number;
  resetAtUtc: string;
};

/**
 * Header pill: daily Will (Telegram) assistant quota, same counter Clara shows
 * for web chat — driven by `User.dailyAgentMessageLimit` and `AgentMessageUsage`.
 */
export function AgentQuotaBadge() {
  const [quota, setQuota] = useState<Quota | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/usage", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as Quota;
      setQuota(data);
    } catch {
      // badge is best-effort
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  if (!quota) return null;

  const low = quota.remaining > 0 && quota.remaining <= 3;
  const empty = quota.remaining === 0;
  const pro = quota.limit >= 200;
  const resetLocal = new Date(quota.resetAtUtc).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div
      className={
        "rounded-full border px-2.5 py-1 text-[10px] leading-tight sm:text-[11px] " +
        (empty
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : low
            ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
            : "border-border bg-muted/50 text-muted-foreground")
      }
      title={`Resets at midnight UTC (~${resetLocal} on your clock). Shared with Telegram.`}
    >
      <span className="font-semibold text-foreground">Will</span>{" "}
      <span className="font-mono tabular-nums">
        {quota.used}/{quota.limit}
      </span>{" "}
      <span className="opacity-80">today</span>
      {pro ? (
        <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-semibold text-primary">
          Pro
        </span>
      ) : null}
    </div>
  );
}
