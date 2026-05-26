import { assertRuntimeConfiguration, createPostgresPrismaAdapter, createTenantRlsPrismaClient, startOutboxProcessor } from "@totem/service-runtime";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaChatRepository } from "./adapters/prisma/chat-repository.js";
import { startAssistantHttpServer } from "./adapters/http/assistant-http-server.js";

const prisma = createTenantRlsPrismaClient(new PrismaClient({ adapter: createPostgresPrismaAdapter() }));
const repository = new PrismaChatRepository(prisma);

assertRuntimeConfiguration("assistant");
await prisma.$executeRawUnsafe(`SET search_path TO assistant, public`);

startOutboxProcessor("assistant", prisma);
startAssistantHttpServer("assistant", repository);
