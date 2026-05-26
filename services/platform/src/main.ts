import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPlatformTenantViewRepository } from "./adapters/prisma/repository.js";
import { PrismaPlatformRepository } from "./adapters/prisma/platform-repository.js";
import { createPlatformBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaPlatformTenantViewRepository(prisma);
const businessRepository = new PrismaPlatformRepository(prisma);

startOutboxProcessor("platform", prisma);
startHttpService("platform", [...createRoutes(repository), ...createPlatformBusinessRoutes(businessRepository, prisma)], { healthCheck: createDbHealthCheck(prisma) });
