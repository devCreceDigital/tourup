import { CalendarDays, CreditCard, FileCheck2, Hotel, UsersRound } from "lucide-react";
import { AppShell } from "@/shared/ui/AppShell";

const modules = [
  { title: "Viajes", value: "15", detail: "tarifas, landing, operaciones", icon: CalendarDays },
  { title: "Inscripciones", value: "248", detail: "preinscritos y confirmados", icon: UsersRound },
  { title: "Pagos", value: "S/ 184k", detail: "cuotas, conciliacion, manuales", icon: CreditCard },
  { title: "Documentos", value: "73%", detail: "revision y aprobacion", icon: FileCheck2 },
  { title: "Rooming", value: "42", detail: "habitaciones y asignaciones", icon: Hotel }
];

export function AdminOperationsConsole() {
  return (
    <AppShell>
      <section className="workband">
        <header className="page-heading">
          <p>Backoffice Admin</p>
          <h1>Operacion comercial y viajera</h1>
        </header>
        <div className="metric-grid">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article className="metric-card" key={module.title}>
                <Icon size={22} />
                <strong>{module.value}</strong>
                <span>{module.title}</span>
                <p>{module.detail}</p>
              </article>
            );
          })}
        </div>
        <section className="data-panel">
          <h2>Pipeline operativo</h2>
          <div className="table-like">
            <span>Viaje</span><span>Inscritos</span><span>Pagado</span><span>Docs</span><span>Rooming</span>
            <strong>Promo Cusco 2026</strong><span>82</span><span>68%</span><span>54%</span><span>En armado</span>
            <strong>Bariloche Universitario</strong><span>116</span><span>72%</span><span>61%</span><span>Bloqueado</span>
            <strong>Senior Europa</strong><span>50</span><span>81%</span><span>79%</span><span>Publicado</span>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
