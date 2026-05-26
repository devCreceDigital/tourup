import { CalendarDays, CheckCircle2, MapPinned } from "lucide-react";
import { AppShell } from "@/shared/ui/AppShell";

export function TripLanding({ token }: Readonly<{ token?: string }>) {
  return (
    <AppShell>
      <section className="workband">
        <header className="page-heading">
          <p>Landing de viaje</p>
          <h1>{token === undefined ? "Promo grupal destacada" : `Viaje ${token}`}</h1>
        </header>
        <div className="metric-grid">
          <article className="metric-card"><MapPinned size={22} /><strong>Cusco</strong><span>Destino</span><p>5 dias / 4 noches</p></article>
          <article className="metric-card"><CalendarDays size={22} /><strong>Julio</strong><span>Salida</span><p>cupos limitados</p></article>
          <article className="metric-card"><CheckCircle2 size={22} /><strong>Incluye</strong><span>Programa</span><p>hotel, tours y asistencia</p></article>
        </div>
      </section>
    </AppShell>
  );
}
