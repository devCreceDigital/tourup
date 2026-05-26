import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { createRoomingBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";
import { PrismaRoomingPlanRepository } from "./adapters/prisma/repository.js";
import { PrismaRoomingRepository } from "./adapters/prisma/rooming-repository.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaRoomingPlanRepository(prisma);
const roomingRepository = new PrismaRoomingRepository(prisma);

startOutboxProcessor("rooming", prisma);
startHttpService("rooming", [...createRoutes(repository), ...createRoomingBusinessRoutes(roomingRepository)], { healthCheck: createDbHealthCheck(prisma) });
