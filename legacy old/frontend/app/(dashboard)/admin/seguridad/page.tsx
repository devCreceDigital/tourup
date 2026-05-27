import PlaceholderModule from "@/components/admin/PlaceholderModule";
import { AlertTriangle } from "lucide-react";

export default function AuditoriaPage() {
  return (
    <PlaceholderModule
      title="Auditoria"
      icon={AlertTriangle}
      description="Aqui veras el log de seguridad y auditoria del sistema:"
      features={[
        "Log de accesos al panel",
        "Cambios criticos (precios, viajes, usuarios)",
        "Intentos de login fallidos",
        "Exportacion de logs para compliance",
        "Alertas de actividad sospechosa",
      ]}
    />
  );
}
