import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPaymentRepository } from "./adapters/prisma/repository.js";
import { PrismaPaymentRepository as PrismaPaymentBusinessRepository } from "./adapters/prisma/payment-repository.js";
import { createPaymentBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaPaymentRepository(prisma);
const businessRepository = new PrismaPaymentBusinessRepository(prisma);

startOutboxProcessor("payments", prisma);
startHttpService("payments", [...createRoutes(repository), ...createPaymentBusinessRoutes(businessRepository, prisma)], { healthCheck: createDbHealthCheck(prisma) });
