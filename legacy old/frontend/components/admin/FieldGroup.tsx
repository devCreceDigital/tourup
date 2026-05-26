import type { ReactNode } from "react";
import { Pencil } from "lucide-react";

/**
 * FieldGroup — Grupo de filas editables tipo "configuracion".
 *
 * Estructura:
 *   <FieldGroup title="Estado" icon="⚡">
 *     <FieldRow label="Estado del viaje">
 *       <Badge>Activo</Badge>
 *     </FieldRow>
 *   </FieldGroup>
 */

interface FieldGroupProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function FieldGroup({ title, icon, children }: FieldGroupProps) {
  return (
    <div className="border border-[#E0E4EF] rounded-[8px] overflow-hidden mb-3.5">
      <div className="bg-[#F5F6FB] px-4 py-3 text-[12px] font-bold text-[#1E1E4E] border-b border-[#E0E4EF] flex items-center gap-1.5 uppercase tracking-wider">
        {icon ? <span className="text-[#5B5BDB]">{icon}</span> : null}
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface FieldRowProps {
  label: string;
  children: ReactNode;
  showEdit?: boolean;
}

export function FieldRow({ label, children, showEdit = true }: FieldRowProps) {
  return (
    <div className="flex items-center px-4 py-3 border-b border-[#E0E4EF] last:border-b-0 gap-3 bg-white">
      <div className="text-[12px] text-[#888] min-w-[200px] shrink-0">{label}</div>
      <div className="text-[13px] text-[#222] font-medium flex-1 flex items-center gap-2">
        {children}
      </div>
      {showEdit ? (
        <button
          type="button"
          className="text-[#5B5BDB] cursor-pointer opacity-65 hover:opacity-100 transition shrink-0"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
