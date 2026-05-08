type Level = "debug" | "info" | "warn" | "error";

type Fields = Record<string, unknown> | undefined;

function deployContext(): Record<string, unknown> {
  return {
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    deployCommit:
      typeof process.env.VERCEL_GIT_COMMIT_SHA === "string"
        ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12)
        : undefined,
    nodeEnv: process.env.NODE_ENV,
  };
}

function emit(level: Level, message: string, fields?: Fields) {
  const payload = {
    ts: new Date().toISOString(),
    ...deployContext(),
    level,
    msg: message,
    ...(fields ?? {}),
  };
  const json = JSON.stringify(payload, jsonReplacer);
  const stream = level === "error" || level === "warn" ? console.error : console.log;
  stream(json);
}

// BigInt is non-JSON-serialisable; render as string instead of crashing.
function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

export const log = {
  debug: (msg: string, fields?: Fields) => emit("debug", msg, fields),
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields) => emit("warn", msg, fields),
  error: (msg: string, fields?: Fields) => emit("error", msg, fields),
};
