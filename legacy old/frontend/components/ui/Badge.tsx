import { cn } from "@/lib/utils";
import type { EstadoPago, EstadoDocumentos, EstadoDocumentoItem } from "@/types";

/**
 * Badge: indicador visual compacto.
 *
 * Soporta DOS APIs:
 *
 * 1. API por variante (texto custom):
 *    <Badge variant="green">Pagado</Badge>
 *
 * 2. API por estado (auto-detecta color y label):
 *    <Badge estado="completo" />
 *    <Badge estado="parcial" />
 *    <Badge estado="faltante" />
 *
 * Si pasas BOTH variant y estado, gana variant.
 * Si no pasas ninguno, default = gray.
 */

type BadgeVariant = "green" | "purple" | "gray" | "orange" | "blue" | "red";

// Todos los estados validos del sistema (union de los 3 tipos)
type BadgeEstado = EstadoPago | EstadoDocumentos | EstadoDocumentoItem;

interface BadgeProps {
  variant?: BadgeVariant;
  estado?: BadgeEstado;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-emerald-100 text-emerald-700",
  purple: "bg-purple-100 text-purple-700",
  gray: "bg-slate-100 text-slate-700",
  orange: "bg-amber-100 text-amber-700",
  blue: "bg-sky-100 text-sky-700",
  red: "bg-rose-100 text-rose-700",
};

// Mapeo de cada estado al color que le corresponde
const estadoToVariant: Record<BadgeEstado, BadgeVariant> = {
  // Estados de pago
  pendiente: "orange",
  parcial: "orange",
  completo: "green",
  // Estados de documentos (general)
  incompleto: "red",
  faltante: "red",
  // Estados de documento individual
  subido: "green",
  en_revision: "blue",
  aprobado: "green",
  rechazado: "red",
};

// Labels legibles para mostrar en pantalla
const estadoToLabel: Record<BadgeEstado, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  completo: "Completo",
  incompleto: "Incompleto",
  faltante: "Faltante",
  subido: "Subido",
  en_revision: "En revision",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export default function Badge({
  variant,
  estado,
  children,
  className,
}: BadgeProps) {
  // Resolver la variante final
  const finalVariant: BadgeVariant =
    variant ?? (estado ? estadoToVariant[estado] : "gray");

  // Resolver el contenido a mostrar
  const content = children ?? (estado ? estadoToLabel[estado] : "");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        variantStyles[finalVariant],
        className
      )}
    >
      {content}
    </span>
  );
}

// Tambien exportamos como named export para compatibilidad
export { Badge };