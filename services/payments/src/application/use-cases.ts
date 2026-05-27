import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Payment } from "../domain/entities.js";
import type { PaymentRepository } from "../ports/repositories.js";
import type { ChangePaymentStatusCommand, CreatePaymentCommand, UpdatePaymentCommand } from "./commands.js";
import type { GetPaymentQuery, ListPaymentsQuery } from "./queries.js";

export class CreatePaymentUseCase {
  constructor(private readonly repository: PaymentRepository, private readonly clock: () => string) {}

  async execute(command: CreatePaymentCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Payment.create({
      id: command.id,
      tenantId: tenantScope(context, command.tenantId),
      status: command.status,
      payload: command.payload,
      now: this.clock()
    });
    await this.repository.save(entity, command.idempotencyKey);
    return entity.toSnapshot();
  }
}

export class UpdatePaymentUseCase {
  constructor(private readonly repository: PaymentRepository, private readonly clock: () => string) {}

  async execute(command: UpdatePaymentCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Payment not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangePaymentStatusUseCase {
  constructor(private readonly repository: PaymentRepository, private readonly clock: () => string) {}

  async execute(command: ChangePaymentStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Payment not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetPaymentUseCase {
  constructor(private readonly repository: PaymentRepository) {}

  async execute(query: GetPaymentQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Payment not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListPaymentsUseCase {
  constructor(private readonly repository: PaymentRepository) {}

  async execute(query: ListPaymentsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
