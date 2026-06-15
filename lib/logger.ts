export const logger = {
  info: (event: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", event, ...meta, ts: new Date().toISOString() })),

  error: (event: string, error?: Error, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({
      level: "error",
      event,
      message: error?.message,
      stack: error?.stack,
      ...meta,
      ts: new Date().toISOString(),
    })),

  warn: (event: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", event, ...meta, ts: new Date().toISOString() })),
}
