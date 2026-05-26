const contexts = [
  "identity",
  "tenancy",
  "catalog",
  "itineraries",
  "trips",
  "enrollments",
  "payments",
  "subscriptions",
  "documents",
  "rooming",
  "notifications",
  "assistant",
  "support",
  "platform",
  "audit"
];

export function ArchitectureDashboard() {
  return (
    <main style={{ minHeight: "100vh", padding: 32 }}>
      <section style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 24 }}>
        <header>
          <h1 style={{ margin: 0, fontSize: 36 }}>Totem HUB</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            Modernizacion activa: DDD, arquitectura hexagonal y microservicios por bounded context.
          </p>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {contexts.map((context) => (
            <article key={context} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
              <strong>{context}</strong>
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>domain, application, ports, adapters, interface</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
