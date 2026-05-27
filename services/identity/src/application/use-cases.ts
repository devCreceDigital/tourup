import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Profile } from "../domain/entities.js";
import type { ProfileRepository } from "../ports/repositories.js";
import type { ChangeProfileStatusCommand, CreateProfileCommand, UpdateProfileCommand } from "./commands.js";
import type { GetProfileQuery, ListProfilesQuery } from "./queries.js";

export class CreateProfileUseCase {
  constructor(private readonly repository: ProfileRepository, private readonly clock: () => string) {}

  async execute(command: CreateProfileCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Profile.create({
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

export class UpdateProfileUseCase {
  constructor(private readonly repository: ProfileRepository, private readonly clock: () => string) {}

  async execute(command: UpdateProfileCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Profile not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeProfileStatusUseCase {
  constructor(private readonly repository: ProfileRepository, private readonly clock: () => string) {}

  async execute(command: ChangeProfileStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Profile not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(query: GetProfileQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Profile not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListProfilesUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(query: ListProfilesQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
