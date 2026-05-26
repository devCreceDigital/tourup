import { PrismaPg } from "@prisma/adapter-pg";
import { AsyncLocalStorage } from "node:async_hooks";
import type { TenantContext } from "@totem/shared-kernel";

type RlsExecutable = {
  readonly $executeRawUnsafe: (query: string, ...values: readonly unknown[]) => Promise<unknown>;
};

type TransactionCapablePrisma = RlsExecutable & {
  readonly $transaction: (...args: readonly unknown[]) => Promise<unknown>;
};

const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export function readRequiredEnvironment(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Required environment variable ${name} is missing.`);
  }
  return value;
}

export function createPostgresPrismaAdapter(env: NodeJS.ProcessEnv = process.env): PrismaPg {
  return new PrismaPg({
    connectionString: readRequiredEnvironment("DATABASE_URL", env)
  });
}

export function currentTenantContext(): TenantContext | null {
  return tenantContextStorage.getStore() ?? null;
}

export async function runWithTenantContext<T>(context: TenantContext, operation: () => Promise<T>): Promise<T> {
  return tenantContextStorage.run(context, operation);
}

export async function applyTenantRlsContext(client: RlsExecutable, context: TenantContext): Promise<void> {
  await client.$executeRawUnsafe("select set_config('app.tenant_id', $1, true)", context.tenantId === null ? "" : String(context.tenantId));
  await client.$executeRawUnsafe("select set_config('app.user_role', $1, true)", context.role);
  await client.$executeRawUnsafe("select set_config('app.user_id', $1, true)", context.userId === null ? "" : String(context.userId));
  await client.$executeRawUnsafe("select set_config('app.request_id', $1, true)", context.requestId);
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return typeof value === "object" && value !== null && "then" in value;
}

function isDelegateMethod(property: string | symbol): boolean {
  return typeof property === "string" && !property.startsWith("$") && !property.startsWith("_");
}

export function createTenantRlsPrismaClient<TClient extends object>(client: TClient): TClient {
  const runtimeClient = client as TransactionCapablePrisma & Record<string | symbol, unknown>;
  const delegateCache = new Map<string | symbol, unknown>();

  const runModelOperation = async <T>(model: string | symbol, method: string | symbol, args: readonly unknown[]): Promise<T> => {
    const context = currentTenantContext();
    if (context === null) {
      const delegate = Reflect.get(runtimeClient, model) as Record<string | symbol, unknown>;
      const fn = delegate[method];
      if (typeof fn !== "function") throw new Error("Invalid Prisma delegate method.");
      return Reflect.apply(fn, delegate, args) as Promise<T>;
    }

    return runtimeClient.$transaction(async (tx: unknown) => {
      const transactionClient = tx as RlsExecutable & Record<string | symbol, Record<string | symbol, unknown>>;
      await applyTenantRlsContext(transactionClient, context);
      const delegate = transactionClient[model];
      const fn = delegate?.[method];
      if (typeof fn !== "function") throw new Error("Invalid Prisma delegate method.");
      return Reflect.apply(fn, delegate, args) as Promise<T>;
    }) as Promise<T>;
  };

  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === "$transaction") {
        return async (operation: unknown, options?: unknown) => {
          if (typeof operation !== "function") {
            const tx = Reflect.get(target, "$transaction", receiver);
            if (typeof tx !== "function") throw new Error("Invalid Prisma transaction method.");
            return Reflect.apply(tx, target, [operation, options]);
          }
          const context = currentTenantContext();
          return runtimeClient.$transaction(async (tx: unknown) => {
            if (context !== null) await applyTenantRlsContext(tx as RlsExecutable, context);
            return operation(tx);
          }, options) as Promise<unknown>;
        };
      }

      const value = Reflect.get(target, property, receiver);
      if (!isDelegateMethod(property) || typeof value !== "object" || value === null) {
        return typeof value === "function" ? value.bind(target) : value;
      }
      if (delegateCache.has(property)) return delegateCache.get(property);

      const delegateProxy = new Proxy(value as Record<string | symbol, unknown>, {
        get(delegateTarget, delegateProperty, delegateReceiver) {
          const delegateValue = Reflect.get(delegateTarget, delegateProperty, delegateReceiver);
          if (typeof delegateValue !== "function" || !isDelegateMethod(delegateProperty)) return delegateValue;
          return (...args: readonly unknown[]) => {
            const result = runModelOperation(property, delegateProperty, args);
            return isPromiseLike(result) ? result : Promise.resolve(result);
          };
        }
      });
      delegateCache.set(property, delegateProxy);
      return delegateProxy;
    }
  }) as TClient;
}
