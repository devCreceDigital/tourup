import { jwtVerify, type JWTPayload } from "jose";

export type GatewayRole = "superadmin" | "admin" | "viajero" | "system" | "anonymous";

export type GatewayPrincipal = {
  readonly tenantId: string | null;
  readonly businessId: string | null;
  readonly userId: string | null;
  readonly role: GatewayRole;
  readonly email: string | null;
};

const publicPathPatterns: readonly RegExp[] = [
  /^\/health$/,
  /^\/[^/]+\/capability\/?$/,
  /^\/tenancy\/public(?:\/|$)/,
  /^\/tenancy\/resolve$/,
  /^\/tenancy\/onboarding\/start$/,
  /^\/identity\/auth\/login$/,
  /^\/identity\/auth\/register$/,
  /^\/identity\/auth\/forgot-password$/,
  /^\/identity\/auth\/reset-password$/,
  /^\/identity\/auth\/verify-email$/,
  /^\/identity\/auth\/resend-verification$/,
  /^\/trips\/?$/,
  /^\/trips\/public(?:\/|$)/,
  /^\/assistant\/sessions\/?$/,
  /^\/assistant\/sessions\/[^/]+\/message\/?$/,
  /^\/assistant\/messages\/?$/,
  /^\/assistant\/leads(?:\/simple)?\/?$/,
  /^\/assistant\/trips\/?$/,
  /^\/assistant\/trips-list\/?$/,
  /^\/assistant\/trips\/[^/]+(?:\/pdf)?\/?$/,
  /^\/support\/public-contact-requests$/,
  /^\/enrollments\/public$/
];

function textClaim(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function objectClaim(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function roleClaim(value: unknown): GatewayRole | null {
  if (value === "superadmin" || value === "admin" || value === "viajero" || value === "system") return value;
  if (value === "usuario") return "viajero";
  return null;
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization === null) return null;
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token !== undefined && token.length > 0 ? token : null;
}

async function verifyJwt(token: string, env: NodeJS.ProcessEnv): Promise<JWTPayload> {
  const secret = env.APP_JWT_SECRET;
  if (typeof secret !== "string" || secret.length < 32) throw new Error("APP_JWT_SECRET must be configured.");
  const issuer = env.APP_JWT_ISSUER;
  const options = typeof issuer === "string" && issuer.trim().length > 0 ? { issuer } : undefined;
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), options);
  return payload;
}

function principalFromClaims(claims: JWTPayload): GatewayPrincipal {
  const appMetadata = objectClaim(claims.app_metadata);
  const userMetadata = objectClaim(claims.user_metadata);
  const tenantId =
    textClaim(appMetadata.tenant_id) ??
    textClaim(appMetadata.tenantId) ??
    textClaim(appMetadata.business_id) ??
    textClaim(userMetadata.tenant_id) ??
    textClaim(userMetadata.tenantId) ??
    textClaim(claims.tenant_id) ??
    textClaim(claims.tenantId) ??
    null;
  const role =
    roleClaim(appMetadata.role) ??
    roleClaim(appMetadata.rol) ??
    roleClaim(userMetadata.role) ??
    roleClaim(userMetadata.rol) ??
    roleClaim(claims.app_role) ??
    "viajero";

  return {
    tenantId,
    businessId: tenantId,
    userId: textClaim(claims.sub),
    role,
    email: textClaim(claims.email)
  };
}

function principalFromProfile(profile: unknown, fallback: GatewayPrincipal): GatewayPrincipal {
  const body = objectClaim(profile);
  const tenantId = textClaim(body.tenantId) ?? textClaim(body.tenant_id) ?? fallback.tenantId;
  return {
    tenantId,
    businessId: tenantId,
    userId: textClaim(body.id) ?? fallback.userId,
    role: roleClaim(body.role) ?? roleClaim(body.rol) ?? fallback.role,
    email: textClaim(body.email) ?? fallback.email
  };
}

async function resolveProfile(principal: GatewayPrincipal, registry: readonly { prefix: string; baseUrl: string }[], env: NodeJS.ProcessEnv): Promise<GatewayPrincipal> {
  if (principal.email === null) return principal;
  const identity = registry.find((route) => route.prefix === "/identity");
  const secret = env.SERVICE_INTERNAL_SECRET;
  if (identity === undefined || typeof secret !== "string" || secret.length === 0) return principal;

  const response = await fetch(new URL("/identity/profile/by-email", identity.baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-service-secret": secret,
      "x-internal-user-role": "system",
      "x-internal-user-id": principal.userId ?? "",
      "x-internal-user-email": principal.email
    },
    body: JSON.stringify({ email: principal.email })
  }).catch(() => null);
  if (response === null || !response.ok) return principal;
  return principalFromProfile(await response.json(), principal);
}

export function isPublicPath(pathname: string): boolean {
  return publicPathPatterns.some((pattern) => pattern.test(pathname));
}

export async function authenticateGatewayRequest(
  request: Request,
  registry: readonly { prefix: string; baseUrl: string }[],
  env: NodeJS.ProcessEnv
): Promise<GatewayPrincipal> {
  const token = bearerToken(request);
  if (token === null) {
    return { tenantId: null, businessId: null, userId: null, role: "anonymous", email: null };
  }
  const claims = await verifyJwt(token, env);
  return resolveProfile(principalFromClaims(claims), registry, env);
}

export function applyTrustedIdentityHeaders(headers: Headers, principal: GatewayPrincipal, env: NodeJS.ProcessEnv, isPublic: boolean): Headers {
  const next = new Headers(headers);
  for (const header of [
    "x-tenant-id",
    "x-user-id",
    "x-user-email",
    "x-user-role",
    "x-business-id",
    "x-internal-service-secret",
    "x-internal-tenant-id",
    "x-internal-business-id",
    "x-internal-user-id",
    "x-internal-user-email",
    "x-internal-user-role",
    "x-internal-public-path"
  ]) {
    next.delete(header);
  }

  const secret = env.SERVICE_INTERNAL_SECRET;
  if (typeof secret === "string" && secret.length > 0) {
    next.set("x-internal-service-secret", secret);
  }
  if (principal.tenantId !== null) next.set("x-internal-tenant-id", principal.tenantId);
  if (principal.businessId !== null) next.set("x-internal-business-id", principal.businessId);
  if (principal.userId !== null) next.set("x-internal-user-id", principal.userId);
  if (principal.email !== null) next.set("x-internal-user-email", principal.email);
  next.set("x-internal-user-role", principal.role);
  next.set("x-internal-public-path", isPublic ? "true" : "false");
  return next;
}
