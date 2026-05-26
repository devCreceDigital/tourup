import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaSupportTicketRepository } from "./adapters/prisma/repository.js";
import { PrismaSupportTicketRepository as PrismaSupportTicketBusinessRepository } from "./adapters/prisma/support-ticket-repository.js";
import { createSupportBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaSupportTicketRepository(prisma);
const businessRepository = new PrismaSupportTicketBusinessRepository(prisma);

startOutboxProcessor("support", prisma);
startHttpService("support", [...createRoutes(repository), ...createSupportBusinessRoutes(businessRepository)], { healthCheck: createDbHealthCheck(prisma) });
