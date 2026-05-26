const unsafeSecretValues = new Set([
  "change-me-app-jwt-secret-32-bytes-min",
  "change-me-internal-service-secret-32"
]);

function isProduction(env: NodeJS.ProcessEnv): boolean {
  if (typeof env.APP_ENV === "string" && env.APP_ENV.trim().length > 0) {
    return env.APP_ENV === "production";
  }
  return env.NODE_ENV === "production";
}

function requireNonEmpty(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function assertSafeSecret(env: NodeJS.ProcessEnv, name: string): void {
  const value = requireNonEmpty(env, name);
  if (value.length < 32) {
    throw new Error(`${name} must have at least 32 characters.`);
  }
  if (unsafeSecretValues.has(value)) {
    throw new Error(`${name} uses an unsafe development placeholder.`);
  }
}

export function assertRuntimeConfiguration(serviceName: string, env: NodeJS.ProcessEnv = process.env): void {
  if (!isProduction(env)) return;

  requireNonEmpty(env, "DATABASE_URL");
  assertSafeSecret(env, "SERVICE_INTERNAL_SECRET");
  requireNonEmpty(env, "APP_URL");

  if (serviceName === "identity" || serviceName === "api-gateway") {
    assertSafeSecret(env, "APP_JWT_SECRET");
  }

  if (serviceName !== "platform") {
    requireNonEmpty(env, "EVENT_BUS_URL");
  }

  if (serviceName === "trips" || serviceName === "enrollments") {
    requireNonEmpty(env, "SUBSCRIPTIONS_SERVICE_URL");
  }

  if (serviceName === "subscriptions") {
    requireNonEmpty(env, "BILLING_PROVIDER_URL");
  }

  if (serviceName === "assistant") {
    const defaultTenant = env.ASSISTANT_DEFAULT_TENANT_ID;
    if (typeof defaultTenant === "string" && defaultTenant.trim().length > 0) {
      throw new Error("ASSISTANT_DEFAULT_TENANT_ID is not allowed in production.");
    }
  }
}
