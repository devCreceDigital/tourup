import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Enrollment } from "../domain/entities.js";
import type { EnrollmentRepository } from "../ports/repositories.js";
import type { ChangeEnrollmentStatusCommand, CreateEnrollmentCommand, UpdateEnrollmentCommand } from "./commands.js";
import type { GetEnrollmentQuery, ListEnrollmentsQuery } from "./queries.js";

export class CreateEnrollmentUseCase {
  constructor(private readonly repository: EnrollmentRepository, private readonly clock: () => string) {}

  async execute(command: CreateEnrollmentCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Enrollment.create({
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

export class UpdateEnrollmentUseCase {
  constructor(private readonly repository: EnrollmentRepository, private readonly clock: () => string) {}

  async execute(command: UpdateEnrollmentCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Enrollment not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeEnrollmentStatusUseCase {
  constructor(private readonly repository: EnrollmentRepository, private readonly clock: () => string) {}

  async execute(command: ChangeEnrollmentStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Enrollment not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetEnrollmentUseCase {
  constructor(private readonly repository: EnrollmentRepository) {}

  async execute(query: GetEnrollmentQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Enrollment not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListEnrollmentsUseCase {
  constructor(private readonly repository: EnrollmentRepository) {}

  async execute(query: ListEnrollmentsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
