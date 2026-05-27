import { Bot, MapPinned, MessageSquareText, UsersRound } from "lucide-react";
import { AppShell } from "@/shared/ui/AppShell";

export function AssistantWorkspace() {
  return (
    <AppShell>
      <section className="workband two-column">
        <section>
          <header className="page-heading">
            <p>Asistente IA</p>
            <h1>Discovery comercial</h1>
          </header>
          <div className="chat-panel">
            <div className="message agent"><Bot size={18} /> Tengo el contexto de destinos, presupuesto y fechas.</div>
            <div className="message user"><MessageSquareText size={18} /> Busco una promo escolar para 80 alumnos.</div>
            <div className="message agent"><Bot size={18} /> Recomiendo Cusco 5D/4N con rooming por habitaciones cuadruples.</div>
          </div>
        </section>
        <aside className="data-panel">
          <h2>Lead operativo</h2>
          <p><UsersRound size={18} /> Grupo escolar estimado: 80 viajeros.</p>
          <p><MapPinned size={18} /> Destino sugerido: Cusco.</p>
        </aside>
      </section>
    </AppShell>
  );
}
