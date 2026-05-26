import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { CloseSupportTicket, CreatePublicContactTicket, CreateSupportTicket, type SupportTicketRepository } from "../../application/support-use-cases.js";
import type { SupportTicket } from "../../domain/support-ticket.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function headerText(value: string | string[] | undefined): string | null {
  const textValue = Array.isArray(value) ? value[0] : value;
  return typeof textValue === "string" && textValue.trim().length > 0 ? textValue.trim() : null;
}

export function createSupportBusinessRoutes(repository: SupportTicketRepository): readonly Route[] {
  const createTicket = new CreateSupportTicket(repository);
  const createPublicContactTicket = new CreatePublicContactTicket(repository);
  const closeTicket = new CloseSupportTicket(repository);
  return [
    {
      method: "POST",
      path: "/support/tickets",
      handler: async (request) => {
        const body = record(request.body);
        const ticket: SupportTicket = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(text(body, "tenantId")),
          adminEmail: typeof body.adminEmail === "string" ? body.adminEmail : request.context.userEmail ?? headerText(request.headers["x-internal-user-email"]) ?? text(body, "adminEmail"),
          subject: text(body, "subject"),
          description: text(body, "description"),
          priority: body.priority === "urgente" || body.priority === "alta" ? body.priority : "normal",
          status: "abierto",
          answer: null
        };
        const key = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${ticket.adminEmail}:${ticket.subject}:${randomUUID()}`);
        return createTicket.execute(ticket, key, request.context);
      }
    },
    {
      method: "POST",
      path: "/support/public-contact-requests",
      handler: async (request) => {
        const body = record(request.body);
        const tenantId = request.context.tenantId ?? parseTenantId(process.env.PUBLIC_CONTACT_TENANT_ID ?? text(body, "tenantId"));
        const requesterEmail = typeof body.email === "string" ? body.email : text(body, "adminEmail");
        const requesterName = typeof body.nombre === "string" ? body.nombre : "Contacto publico";
        const message = typeof body.mensaje === "string" ? body.mensaje : "";
        const ticket: SupportTicket = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId,
          adminEmail: requesterEmail,
          subject: `Contacto publico: ${requesterName}`,
          description: JSON.stringify({
            requesterName,
            requesterEmail,
            phone: typeof body.telefono === "string" ? body.telefono : "",
            school: typeof body.colegio === "string" ? body.colegio : "",
            travelerCount: typeof body.cantidad === "string" ? body.cantidad : "",
            message
          }),
          priority: "normal",
          status: "abierto",
          answer: null
        };
        const key = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${requesterEmail}:public-contact:${randomUUID()}`);
        return createPublicContactTicket.execute(ticket, key);
      }
    },
    {
      method: "POST",
      path: "/support/tickets/close",
      handler: async (request) => closeTicket.execute(parseEntityId(text(record(request.body), "ticketId")), request.context)
    }
  ];
}
