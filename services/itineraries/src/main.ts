import { createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaItineraryRepository } from "./adapters/prisma/repository.js";
import { PrismaItineraryRepository as PrismaItineraryBusinessRepository } from "./adapters/prisma/itinerary-repository.js";
import { createItineraryBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaItineraryRepository(prisma);
const businessRepository = new PrismaItineraryBusinessRepository(prisma);

startOutboxProcessor("itineraries", prisma);
startHttpService("itineraries", [...createRoutes(repository), ...createItineraryBusinessRoutes(businessRepository)]);
