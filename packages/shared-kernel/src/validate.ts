/**
 * Validación de inputs con Zod.
 *
 * Centraliza los schemas más usados y provee `validate()`, que convierte
 * errores de Zod en `ValidationError(422)` con todos los mensajes concatenados.
 *
 * Uso:
 *   const body = validate(CreateTripSchema, request.body);
 *   // body está completamente tipado — sin cast manual
 *
 * Exporta también `z` para que los servicios no tengan que importar zod directamente.
 */

import { z } from "zod";
import { ValidationError } from "./errors.js";

export { z };

// ─── Schemas primitivos reutilizables ────────────────────────────────────────

/** UUID válido (cualquier versión 1-5) */
export const uuidSchema = z.string().uuid({ message: "Must be a valid UUID." });

/** Email normalizado: trimmed + lowercase */
export const emailSchema = z
  .string({ required_error: "email is required." })
  .trim()
  .toLowerCase()
  .email({ message: "Must be a valid email address." });

/** Cadena no vacía (trimmed). El label aparece en el mensaje de error. */
export function nonEmptyString(label: string): z.ZodEffects<z.ZodString, string, string> {
  return z
    .string({ required_error: `${label} is required.` })
    .min(1, { message: `${label} must not be empty.` })
    .transform((v) => v.trim());
}

/** Entero positivo >= 1 (acepta strings via coerce) */
export const positiveIntSchema = z.coerce.number().int().min(1);

/** Paginación: { page, pageSize } */
export const paginationSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

/**
 * Monto monetario: string decimal con hasta 2 decimales.
 * Ej: "500.00", "1234", "0.99"
 */
export const currencyAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { message: "Must be a decimal number with at most 2 decimal places (e.g. '500.00')." });

/** Código de moneda ISO 4217 soportado */
export const currencyCodeSchema = z.enum(["PEN", "USD", "EUR", "COP", "ARS", "BRL", "CLP", "MXN"], {
  errorMap: () => ({ message: "Must be a supported currency code: PEN, USD, EUR, COP, ARS, BRL, CLP, MXN." })
});

/** Datetime ISO 8601 con offset (acepta "Z" y "+HH:MM") */
export const isoDatetimeSchema = z.string().datetime({ offset: true, message: "Must be an ISO 8601 datetime string." });

/** Teléfono internacional (formato E.164 permisivo) */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, { message: "Must be a valid phone number." });

/** Estado de agregado estándar del sistema */
export const aggregateStatusSchema = z.enum(
  ["draft", "active", "published", "archived", "cancelled", "completed"],
  { errorMap: () => ({ message: "Must be one of: draft, active, published, archived, cancelled, completed." }) }
);

/** Rol de usuario */
export const userRoleSchema = z.enum(["superadmin", "admin", "viajero"], {
  errorMap: () => ({ message: "Must be one of: superadmin, admin, viajero." })
});

// ─── Función principal de validación ────────────────────────────────────────

/**
 * Valida `data` contra el schema dado.
 * Lanza `ValidationError(422)` con todos los errores concatenados si falla.
 * Retorna el dato parseado y transformado si tiene éxito.
 *
 * @example
 * const body = validate(z.object({ email: emailSchema, password: nonEmptyString("password") }), request.body);
 */
export function validate<TOutput>(schema: z.ZodType<TOutput>, data: unknown): TOutput {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map((issue) => {
      const path = issue.path.join(".");
      return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
    });
    throw new ValidationError(messages.join("; "));
  }
  return result.data;
}

/**
 * Valida `data` parcialmente: sólo las claves presentes en el objeto son validadas.
 * Útil en endpoints PATCH donde el body puede contener sólo algunos campos.
 *
 * @example
 * const updates = validatePartial(UpdateTripSchema, request.body);
 */
export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): Partial<z.infer<z.ZodObject<T>>> {
  return validate(schema.partial(), data);
}
