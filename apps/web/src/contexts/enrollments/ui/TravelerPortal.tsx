import { CreditCard, FileText, Plane, UserCheck } from "lucide-react";
import { AppShell } from "@/shared/ui/AppShell";

export function TravelerPortal() {
  return (
    <AppShell>
      <section className="workband">
        <header className="page-heading">
          <p>Portal Viajero</p>
          <h1>Mi viaje y pendientes</h1>
        </header>
        <div className="metric-grid">
          <article className="metric-card"><Plane size={22} /><strong>Cusco</strong><span>Viaje</span><p>salida confirmada</p></article>
          <article className="metric-card"><CreditCard size={22} /><strong>3/5</strong><span>Cuotas</span><p>pagos registrados</p></article>
          <article className="metric-card"><FileText size={22} /><strong>2</strong><span>Documentos</span><p>en revision</p></article>
          <article className="metric-card"><UserCheck size={22} /><strong>OK</strong><span>Inscripcion</span><p>datos validados</p></article>
        </div>
      </section>
    </AppShell>
  );
}
