import { z } from "zod";
import { ValidationError } from "./errors.js";

export { z };

// ─── Schemas primitivos reutilizables ────────────────────────────────────────

export const uuidSchema = z.string().uuid();

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email();

export function nonEmptyString(label: string) {
  return z
    .string()
    .trim()
    .min(1, { message: `${label} must not be empty.` });
}

export const positiveIntSchema = z.coerce.number().int().min(1);

export const paginationSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const currencyAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { message: "Must be a decimal number with at most 2 decimal places (e.g. '500.00')." });

export const currencyCodeSchema = z.enum(["PEN", "USD", "EUR", "COP", "ARS", "BRL", "CLP", "MXN"]);

export const isoDatetimeSchema = z.string().datetime({ offset: true });

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, { message: "Must be a valid phone number." });

export const aggregateStatusSchema = z.enum(
  ["draft", "active", "published", "archived", "cancelled", "completed"]
);

export const userRoleSchema = z.enum(["superadmin", "admin", "viajero"]);

// ─── Función principal de validación ────────────────────────────────────────

export function validate<TOutput>(schema: z.ZodType<TOutput>, data: unknown): TOutput {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues;
    const messages = issues.map((issue) => {
      const path = issue.path.join(".");
      return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
    });
    throw new ValidationError(messages.join("; "));
  }
  return result.data;
}

export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): z.infer<ReturnType<z.ZodObject<T>["partial"]>> {
  return validate(schema.partial(), data) as z.infer<ReturnType<z.ZodObject<T>["partial"]>>;
}
