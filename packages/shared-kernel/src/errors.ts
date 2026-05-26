/**
 * Jerarquía de errores HTTP.
 *
 * Estas clases son lanzadas desde cualquier capa (dominio, aplicación, adaptadores)
 * y capturadas por el service-runtime para devolver el código HTTP correcto.
 *
 * Regla de uso:
 *   - BadRequestError (400)   → datos inválidos enviados por el cliente
 *   - UnauthorizedError (401) → sin sesión / token inválido o expirado
 *   - ForbiddenError (403)    → sesión válida pero sin permisos
 *   - NotFoundError (404)     → recurso no encontrado
 *   - ConflictError (409)     → violación de unicidad / estado inconsistente
 *   - ValidationError (422)   → datos semánticamente inválidos
 *   - Error genérico          → 500 (el runtime lo clasifica como error interno)
 */

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = this.constructor.name;
    // Mantiene el stack trace en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400, "bad_request");
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Authentication required.") {
    super(message, 401, "unauthorized");
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Insufficient permissions.") {
    super(message, 403, "forbidden");
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found.") {
    super(message, 404, "not_found");
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message, 409, "conflict");
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(message, 422, "validation_error");
  }
}
