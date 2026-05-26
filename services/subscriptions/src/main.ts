import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaSubscriptionRepository } from "./adapters/prisma/repository.js";
import { PrismaSubscriptionRepository as PrismaSubscriptionBusinessRepository } from "./adapters/prisma/subscription-repository.js";
import { createSubscriptionBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaSubscriptionRepository(prisma);
const businessRepository = new PrismaSubscriptionBusinessRepository(prisma);

startOutboxProcessor("subscriptions", prisma);
startHttpService("subscriptions", [...createRoutes(repository), ...createSubscriptionBusinessRoutes(businessRepository)], { healthCheck: createDbHealthCheck(prisma) });
