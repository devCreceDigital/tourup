export type ServiceName =
  | "identity"
  | "tenancy"
  | "catalog"
  | "itineraries"
  | "trips"
  | "enrollments"
  | "payments"
  | "subscriptions"
  | "documents"
  | "rooming"
  | "notifications"
  | "assistant"
  | "support"
  | "platform"
  | "audit";

export type ServiceRoute = {
  readonly prefix: string;
  readonly service: ServiceName;
  readonly baseUrl: string;
};

export function loadServiceRegistry(env: NodeJS.ProcessEnv): readonly ServiceRoute[] {
  return [
    { prefix: "/identity", service: "identity", baseUrl: env.IDENTITY_URL ?? "http://identity:4101" },
    { prefix: "/tenancy", service: "tenancy", baseUrl: env.TENANCY_URL ?? "http://tenancy:4102" },
    { prefix: "/catalog", service: "catalog", baseUrl: env.CATALOG_URL ?? "http://catalog:4103" },
    { prefix: "/itineraries", service: "itineraries", baseUrl: env.ITINERARIES_URL ?? "http://itineraries:4104" },
    { prefix: "/trips", service: "trips", baseUrl: env.TRIPS_URL ?? "http://trips:4105" },
    { prefix: "/enrollments", service: "enrollments", baseUrl: env.ENROLLMENTS_URL ?? "http://enrollments:4106" },
    { prefix: "/payments", service: "payments", baseUrl: env.PAYMENTS_URL ?? "http://payments:4107" },
    { prefix: "/subscriptions", service: "subscriptions", baseUrl: env.SUBSCRIPTIONS_URL ?? "http://subscriptions:4108" },
    { prefix: "/documents", service: "documents", baseUrl: env.DOCUMENTS_URL ?? "http://documents:4109" },
    { prefix: "/rooming", service: "rooming", baseUrl: env.ROOMING_URL ?? "http://rooming:4110" },
    { prefix: "/notifications", service: "notifications", baseUrl: env.NOTIFICATIONS_URL ?? "http://notifications:4111" },
    { prefix: "/assistant", service: "assistant", baseUrl: env.ASSISTANT_URL ?? "http://assistant:4112" },
    { prefix: "/support", service: "support", baseUrl: env.SUPPORT_URL ?? "http://support:4113" },
    { prefix: "/platform", service: "platform", baseUrl: env.PLATFORM_URL ?? "http://platform:4114" },
    { prefix: "/audit", service: "audit", baseUrl: env.AUDIT_URL ?? "http://audit:4115" }
  ];
}
