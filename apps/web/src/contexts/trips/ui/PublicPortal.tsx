import Link from "next/link";
import { CalendarDays, MapPinned, PlaneTakeoff } from "lucide-react";
import { AppShell } from "@/shared/ui/AppShell";

export function PublicPortal() {
  return (
    <AppShell>
      <section className="hero">
        <div>
          <h1>Totem HUB</h1>
          <p>Viajes grupales con inscripcion, pagos, documentos y rooming integrados.</p>
          <div className="actions">
            <Link href="/viajes">Ver viajes</Link>
            <Link href="/registro">Crear cuenta</Link>
          </div>
        </div>
      </section>
      <section className="workband">
        <div className="metric-grid">
          <article className="metric-card"><PlaneTakeoff size={22} /><strong>Escolares</strong><span>Programas</span><p>operacion grupal completa</p></article>
          <article className="metric-card"><MapPinned size={22} /><strong>LatAm</strong><span>Destinos</span><p>catalogo y landings</p></article>
          <article className="metric-card"><CalendarDays size={22} /><strong>2026</strong><span>Temporadas</span><p>cupos y salidas</p></article>
        </div>
      </section>
    </AppShell>
  );
}
