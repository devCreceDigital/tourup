import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbiddenPaths = [
  "backend/apps",
  "backend/src/totem_hub",
  "frontend/components",
  "frontend/lib",
  "frontend/types"
];

for (const path of forbiddenPaths) {
  if (existsSync(path)) {
    throw new Error(`Forbidden legacy or monolith path exists: ${path}`);
  }
}

const required = ["apps/web", "apps/api-gateway", "packages/shared-kernel", "packages/service-runtime", "services"];
for (const path of required) {
  if (!existsSync(path)) {
    throw new Error(`Required active architecture path is missing: ${path}`);
  }
}

const serviceRequiredSubpaths = [
  "src/domain/entities.ts",
  "src/domain/events.ts",
  "src/domain/errors.ts",
  "src/application/commands.ts",
  "src/application/queries.ts",
  "src/application/use-cases.ts",
  "src/ports/repositories.ts",
  "src/adapters/http/routes.ts",
  "src/adapters/http/business-routes.ts",
  "src/adapters/prisma/repository.ts",
  "src/main.ts",
  "prisma/schema.prisma"
];

for (const service of readdirSync("services")) {
  const servicePath = join("services", service);
  if (!statSync(servicePath).isDirectory()) continue;
  for (const subpath of serviceRequiredSubpaths) {
    const requiredPath = join(servicePath, subpath);
    if (!existsSync(requiredPath)) {
      throw new Error(`${service} missing ${subpath}`);
    }
  }
}

function walk(dir) {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory() && (entry === "node_modules" || entry === "generated" || entry === "dist" || entry === ".next")) {
      return [];
    }
    return stat.isDirectory() ? walk(path) : [path];
  });
}

const files = [...walk("services"), ...walk("apps"), ...walk("packages")].filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"));
const forbiddenCodePatterns = [" as any", " as never", "@ts-ignore", "eslint-disable"];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const pattern of forbiddenCodePatterns) {
    if (text.includes(pattern)) {
      throw new Error(`Forbidden code pattern ${pattern}: ${file}`);
    }
  }
  if (file.includes("/domain/") && (text.includes("@prisma/client") || text.includes("node:http"))) {
    throw new Error(`Domain layer imports infrastructure: ${file}`);
  }
  if (file.includes("/application/") && text.includes("@prisma/client")) {
    throw new Error(`Application layer imports prisma: ${file}`);
  }
  if (file.includes("/ui/") && text.includes("fetch(")) {
    throw new Error(`UI layer performs direct fetch: ${file}`);
  }
}

console.log("[architecture] ok: ddd hexagonal microservices");
