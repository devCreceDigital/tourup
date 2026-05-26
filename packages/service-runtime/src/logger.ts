/**
 * Logger estructurado — salida JSON por línea a stdout/stderr.
 *
 * Formato de cada línea:
 * {"ts":"2025-01-15T12:00:00.000Z","level":"info","service":"payments","message":"...", ...context}
 *
 * Compatible con Datadog, CloudWatch, Loki, ELK sin configuración extra.
 *
 * Uso:
 *   const log = createLogger("payments");
 *   log.info("Service started", { port: 3000 });
 *   log.error("DB error", { error, requestId });
 *
 *   // Logger con contexto de request (no repites requestId en cada llamada)
 *   const reqLog = log.withContext({ requestId: "abc", tenantId: "xyz" });
 *   reqLog.info("Payment processed", { amount: "500.00" });
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, ctx?: LogContext): void;
  info(message: string, ctx?: LogContext): void;
  warn(message: string, ctx?: LogContext): void;
  error(message: string, ctx?: LogContext): void;
  /** Retorna un nuevo logger con el contexto base mezclado en cada entrada */
  withContext(base: LogContext): Logger;
}

// ─── Nivel mínimo de log ───────────────────────────────────────────────────────
const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function resolveMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env === "debug" || env === "info" || env === "warn" || env === "error") return env;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const MIN_LEVEL = resolveMinLevel();

// ─── Serialización de errores ──────────────────────────────────────────────────
function serializeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) return { raw: String(err) };
  const base: Record<string, unknown> = {
    name:    err.name,
    message: err.message
  };
  // Stack solo en desarrollo para no inflar los logs en producción
  if (process.env.NODE_ENV !== "production" && typeof err.stack === "string") {
    base.stack = err.stack;
  }
  return base;
}

// ─── Serialización del contexto ────────────────────────────────────────────────
function serializeContext(ctx: LogContext): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (value instanceof Error) {
      result[key] = serializeError(value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// ─── Implementación del logger ─────────────────────────────────────────────────
function emit(
  level: LogLevel,
  service: string,
  message: string,
  base: LogContext,
  extra: LogContext | undefined
): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;

  const entry: Record<string, unknown> = {
    ts:      new Date().toISOString(),
    level,
    service,
    message,
    ...serializeContext(base),
    ...(extra !== undefined ? serializeContext(extra) : {})
  };

  const line = JSON.stringify(entry);

  // Error y warn van a stderr, el resto a stdout
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

function createLoggerWithBase(service: string, base: LogContext): Logger {
  return {
    debug: (msg, ctx) => emit("debug", service, msg, base, ctx),
    info:  (msg, ctx) => emit("info",  service, msg, base, ctx),
    warn:  (msg, ctx) => emit("warn",  service, msg, base, ctx),
    error: (msg, ctx) => emit("error", service, msg, base, ctx),
    withContext: (newBase) => createLoggerWithBase(service, { ...base, ...newBase })
  };
}

/**
 * Crea un logger para el servicio indicado.
 * Llamar una vez al inicio y reusar la instancia.
 */
export function createLogger(service: string): Logger {
  return createLoggerWithBase(service, {});
}
