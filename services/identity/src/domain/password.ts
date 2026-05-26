import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Longitud de la clave derivada con scrypt (64 bytes = 512 bits).
 */
const KEY_LENGTH = 64;

/**
 * Formato del hash almacenado en base de datos:
 *   scrypt$v1$<salt_base64url>$<hash_base64url>
 */
const HASH_PREFIX = "scrypt$v1";

/**
 * Hashea una contraseña usando scrypt con salt aleatorio.
 * Lanza BadRequestError si la contraseña tiene menos de 8 caracteres.
 */
export function hashPassword(password: string): string {
  if (password.length < 8) {
    throw new Error("Password must have at least 8 characters.");
  }
  const salt = randomBytes(24).toString("base64url");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("base64url");
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

/**
 * Verifica una contraseña contra un hash almacenado.
 * Usa comparación en tiempo constante para evitar timing attacks.
 * Retorna false para cualquier hash malformado sin lanzar.
 */
export function verifyPassword(password: string, encoded: string): boolean {
  const parts = encoded.split("$");
  // Formato esperado: ["scrypt", "v1", salt, hash] → 4 partes
  if (parts.length !== 4) return false;
  const [algorithm, version, salt, expected] = parts;
  if (algorithm !== "scrypt" || version !== "v1") return false;
  if (!salt || !expected) return false;

  try {
    const actual = scryptSync(password, salt, KEY_LENGTH);
    const expectedBuffer = Buffer.from(expected, "base64url");
    if (actual.byteLength !== expectedBuffer.byteLength) return false;
    return timingSafeEqual(actual, expectedBuffer);
  } catch {
    // scrypt puede lanzar si los parámetros son inválidos
    return false;
  }
}

/**
 * Número máximo de intentos fallidos antes de bloquear la cuenta.
 */
export const MAX_FAILED_ATTEMPTS = 10;

/**
 * Duración del bloqueo en milisegundos (15 minutos).
 */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/**
 * Devuelve la fecha de desbloqueo dado el número actual de intentos fallidos.
 * Retorna null si aún no debe bloquearse.
 */
export function computeLockoutExpiry(failedCount: number, now: Date): Date | null {
  if (failedCount < MAX_FAILED_ATTEMPTS) return null;
  return new Date(now.getTime() + LOCKOUT_DURATION_MS);
}

// ─── Email verification ───────────────────────────────────────────────────────

/**
 * TTL de los tokens de verificación de email (24 horas).
 */
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Genera un token de verificación de email.
 * Mismo patrón que generateResetToken pero TTL más largo.
 */
export function generateEmailVerificationToken(now: Date): {
  readonly rawToken: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
} {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken, "utf-8").digest("hex");
  const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS);
  return { rawToken, tokenHash, expiresAt };
}

// ─── Password reset ───────────────────────────────────────────────────────────

/**
 * TTL de los tokens de restablecimiento de contraseña (1 hora).
 */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Genera un token opaco de reset (48 bytes aleatorios en base64url).
 * Retorna el token en claro (para enviarlo por email) y su hash SHA-256
 * (para almacenar en base de datos).
 */
export function generateResetToken(now: Date): {
  readonly rawToken: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
} {
  const rawToken = randomBytes(48).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken, "utf-8").digest("hex");
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS);
  return { rawToken, tokenHash, expiresAt };
}

/**
 * Devuelve true si el token expiró o ya fue usado.
 */
export function isResetTokenExpired(token: {
  expiresAt: Date;
  usedAt: Date | null;
}, now: Date): boolean {
  return token.usedAt !== null || token.expiresAt <= now;
}
