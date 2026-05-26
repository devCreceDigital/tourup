import { createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaAuditEventRepository } from "./adapters/prisma/repository.js";
import { PrismaAuditRepository } from "./adapters/prisma/audit-repository.js";
import { createAuditBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaAuditEventRepository(prisma);
const businessRepository = new PrismaAuditRepository(prisma);

startOutboxProcessor("audit", prisma);
startHttpService("audit", [...createRoutes(repository), ...createAuditBusinessRoutes(businessRepository)]);
