export type ApiRequest = {
  readonly path: string;
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: Record<string, unknown>;
  readonly tenantId?: string;
  readonly userId?: string;
  readonly role?: "superadmin" | "admin" | "viajero" | "system" | "anonymous";
};

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async request<TResponse>(request: ApiRequest): Promise<TResponse> {
    const headers = new Headers({ "content-type": "application/json" });
    if (request.tenantId !== undefined) headers.set("x-tenant-id", request.tenantId);
    if (request.userId !== undefined) headers.set("x-user-id", request.userId);
    if (request.role !== undefined) headers.set("x-user-role", request.role);
    const init: RequestInit = {
      method: request.method ?? "GET",
      headers,
      cache: "no-store"
    };
    if (request.body !== undefined) {
      init.body = JSON.stringify(request.body);
    }
    const response = await fetch(`${this.baseUrl}${request.path}`, init);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text.length > 0 ? text : `API request failed: ${request.path}`);
    }
    return response.json() as Promise<TResponse>;
  }
}

export function apiClient(): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof baseUrl === "string" && baseUrl.trim().length > 0) return new ApiClient(baseUrl);
  if (process.env.NODE_ENV !== "production") return new ApiClient("http://localhost:4100");
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required.");
}
