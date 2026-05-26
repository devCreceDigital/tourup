import { createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaTenantRepository } from "./adapters/prisma/repository.js";
import { PrismaTenantManagementRepository } from "./adapters/prisma/tenant-repository.js";
import { createRoutes } from "./adapters/http/routes.js";
import { createTenancyBusinessRoutes } from "./adapters/http/business-routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaTenantRepository(prisma);
const tenantManagementRepository = new PrismaTenantManagementRepository(prisma);

startOutboxProcessor("tenancy", prisma);
startHttpService("tenancy", [...createRoutes(repository), ...createTenancyBusinessRoutes(tenantManagementRepository)]);
