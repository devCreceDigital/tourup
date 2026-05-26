import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaNotificationRepository } from "./adapters/prisma/repository.js";
import { PrismaNotificationRepository as PrismaNotificationBusinessRepository } from "./adapters/prisma/notification-repository.js";
import { createNotificationBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaNotificationRepository(prisma);
const businessRepository = new PrismaNotificationBusinessRepository(prisma);

startOutboxProcessor("notifications", prisma);
startHttpService("notifications", [...createRoutes(repository), ...createNotificationBusinessRoutes(businessRepository)], { healthCheck: createDbHealthCheck(prisma) });
