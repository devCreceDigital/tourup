import { Building2, ShieldCheck, TrendingUp } from "lucide-react";
import { AppShell } from "@/shared/ui/AppShell";

export function SuperadminConsole() {
  return (
    <AppShell>
      <section className="workband">
        <header className="page-heading">
          <p>Superadmin</p>
          <h1>Gobierno SaaS multi-tenant</h1>
        </header>
        <div className="metric-grid">
          <article className="metric-card"><Building2 size={22} /><strong>31</strong><span>Tenants</span><p>activos y en onboarding</p></article>
          <article className="metric-card"><TrendingUp size={22} /><strong>94%</strong><span>Salud</span><p>servicios disponibles</p></article>
          <article className="metric-card"><ShieldCheck size={22} /><strong>15</strong><span>Contextos</span><p>DDD hexagonal verificado</p></article>
        </div>
        <section className="data-panel">
          <h2>Control de tenants</h2>
          <div className="table-like">
            <span>Tenant</span><span>Plan</span><span>Estado</span><span>MRR</span><span>Riesgo</span>
            <strong>Traventia</strong><span>Growth</span><span>Activo</span><span>S/ 899</span><span>Bajo</span>
            <strong>Campus Trips</strong><span>Starter</span><span>Onboarding</span><span>S/ 299</span><span>Medio</span>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
