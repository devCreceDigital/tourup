import { createDbHealthCheck, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaEnrollmentRepository } from "./adapters/prisma/repository.js";
import { PrismaEnrollmentRepository as PrismaEnrollmentBusinessRepository } from "./adapters/prisma/enrollment-repository.js";
import { createEnrollmentBusinessRoutes } from "./adapters/http/business-routes.js";
import { createRoutes } from "./adapters/http/routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaEnrollmentRepository(prisma);
const businessRepository = new PrismaEnrollmentBusinessRepository(prisma);

startOutboxProcessor("enrollments", prisma);
startHttpService("enrollments", [...createRoutes(repository), ...createEnrollmentBusinessRoutes(businessRepository)], { healthCheck: createDbHealthCheck(prisma) });
