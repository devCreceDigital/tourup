import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaTravelerDocumentRepository } from "./adapters/prisma/repository.js";
import { PrismaTravelerDocumentRepository as PrismaTravelerDocumentBusinessRepository } from "./adapters/prisma/traveler-document-repository.js";
import { PrismaDocumentAuditPort } from "./adapters/prisma/document-audit-port.js";
import { createDocumentBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaTravelerDocumentRepository(prisma);
const businessRepository = new PrismaTravelerDocumentBusinessRepository(prisma);
const documentAudit = new PrismaDocumentAuditPort(prisma);

startOutboxProcessor("documents", prisma);
startHttpService("documents", [...createRoutes(repository), ...createDocumentBusinessRoutes(businessRepository, documentAudit)], { healthCheck: createDbHealthCheck(prisma) });
