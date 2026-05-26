import { createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaTripRepository } from "./adapters/prisma/repository.js";
import { PrismaTripCatalogRepository } from "./adapters/prisma/trip-catalog-repository.js";
import { createTripBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaTripRepository(prisma);
const catalogRepository = new PrismaTripCatalogRepository(prisma);

startOutboxProcessor("trips", prisma);
startHttpService("trips", [...createRoutes(repository), ...createTripBusinessRoutes(catalogRepository)]);
