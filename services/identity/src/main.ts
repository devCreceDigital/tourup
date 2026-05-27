import { createPostgresPrismaAdapter, createTenantRlsPrismaClient, startHttpService, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaProfileRepository as PrismaProfileGenericRepository } from "./adapters/prisma/repository.js";
import { PrismaProfileRepository } from "./adapters/prisma/profile-repository.js";
import { createRoutes } from "./adapters/http/routes.js";
import { createIdentityBusinessRoutes } from "./adapters/http/business-routes.js";
import { createIdentityAuthRoutes } from "./adapters/http/auth-routes.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaProfileGenericRepository(prisma);
const profileRepository = new PrismaProfileRepository(prisma);

startOutboxProcessor("identity", prisma);
startHttpService("identity", [...createRoutes(repository), ...createIdentityBusinessRoutes(profileRepository, prisma), ...createIdentityAuthRoutes(prisma)]);
