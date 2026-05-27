import { createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaCatalogItemRepository } from "./adapters/prisma/repository.js";
import { PrismaCatalogRepository } from "./adapters/prisma/catalog-repository.js";
import { createCatalogBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaCatalogItemRepository(prisma);
const catalogRepository = new PrismaCatalogRepository(prisma);

startOutboxProcessor("catalog", prisma);
startHttpService("catalog", [...createRoutes(repository), ...createCatalogBusinessRoutes(catalogRepository)]);
