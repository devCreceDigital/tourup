"use client";

import React from "react";
import { Eye, CheckCircle2, Clock, AlertCircle, FileText, File, MoreVertical, Plus } from "lucide-react";
import { type InscripcionAPI } from "@/lib/mockInscritos";

interface TablaInscritosProps {
  inscritos: InscripcionAPI[];
  onViewDetails: (inscrito: InscripcionAPI) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function getInitials(nombre: string) {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function avatarColor(nombre: string) {
  const colors = [
    "bg-[#eeedfe] text-[#3c3489]",
    "bg-[#e1f5ee] text-[#085041]",
    "bg-[#faeeda] text-[#633806]",
    "bg-[#fcebeb] text-[#791f1f]",
    "bg-[#e6f1fb] text-[#0c447c]",
    "bg-[#f4c0d1] text-[#72243e]",
  ];
  return colors[nombre.charCodeAt(0) % colors.length];
}

function PagoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    completo: "bg-[#e1f5ee] text-[#0f6e56]",
    parcial: "bg-[#faeeda] text-[#854f0b]",
    pendiente: "bg-[#faeeda] text-[#854f0b]",
    faltante: "bg-[#fcebeb] text-[#a32d2d]",
    rechazado: "bg-[#fcebeb] text-[#a32d2d]",
  };
  const labels: Record<string, string> = {
    completo: "Confirmado",
    parcial: "Parcial",
    pendiente: "Pendiente Pago",
    faltante: "Sin Pago",
    rechazado: "Rechazado",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${styles[estado] ?? "bg-[#f1efe8] text-[#5f5e5a]"}`}>
      {estado === "completo" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {labels[estado] ?? estado}
    </span>
  );
}

function DocsBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    completo: "text-[#1D9E75]",
    incompleto: "text-[#BA7517]",
    pendiente: "text-[#BA7517]",
    faltante: "text-[#a32d2d]",
  };
  return (
    <div className="flex gap-1.5">
      <FileText className={`h-4 w-4 ${styles[estado] ?? "text-[#aaa]"}`} />
      <File className={`h-4 w-4 ${estado === "completo" ? "text-[#1D9E75]" : "text-[#ddd]"}`} />
    </div>
  );
}

export default function TablaInscritos({ inscritos, onViewDetails, selectedIds, onSelectionChange }: TablaInscritosProps) {
  const allSelected = inscritos.length > 0 && inscritos.every((i) => selectedIds.includes(i.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => onSelectionChange(allSelected ? [] : inscritos.map((i) => i.id));
  const toggleOne = (id: string) => onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);

  return (
    <div className="px-5 pb-6 relative">
      <div className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf9ff] border-b border-[#ede9f8]">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={toggleAll} className="accent-[#5B4FE8] h-4 w-4 rounded cursor-pointer" />
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Viajero</th>
                <th className="px-3 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Viaje</th>
                <th className="px-3 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Estado</th>
                <th className="px-3 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Pago</th>
                <th className="px-3 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Documentos</th>
                <th className="px-3 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Fecha</th>
                <th className="px-3 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f3fb]">
              {inscritos.map((inscrito) => {
                const checked = selectedIds.includes(inscrito.id);
                const fecha = inscrito.created_at ? new Date(inscrito.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "—";
                return (
                  <tr key={inscrito.id} className={`transition ${checked ? "bg-[#f0edf8]" : "hover:bg-[#faf9ff]"}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleOne(inscrito.id)} className="accent-[#5B4FE8] h-4 w-4 rounded cursor-pointer" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${avatarColor(inscrito.viajero_nombre)}`}>
                          {getInitials(inscrito.viajero_nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-[#1a1a2e] truncate">{inscrito.viajero_nombre}</p>
                          <p className="text-[10px] text-[#aaa] truncate">{inscrito.viajero_email}</p>
                          <p className="text-[10px] text-[#ccc]">ID: #{inscrito.id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[11px] font-semibold text-[#1a1a2e]">{inscrito.tipo_habitacion ?? "—"}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${inscrito.estado === "confirmado" ? "bg-[#e1f5ee] text-[#0f6e56]" : inscrito.estado === "pre_inscrito" ? "bg-[#eeedfe] text-[#3c3489]" : inscrito.estado === "cancelado" ? "bg-[#fcebeb] text-[#a32d2d]" : "bg-[#f1efe8] text-[#5f5e5a]"}`}>
                        {inscrito.estado === "confirmado" ? <CheckCircle2 className="h-3 w-3" /> : inscrito.estado === "pre_inscrito" ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {inscrito.estado.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3"><PagoBadge estado={inscrito.pago_estado} /></td>
                    <td className="px-3 py-3"><DocsBadge estado={inscrito.docs_estado} /></td>
                    <td className="px-3 py-3"><p className="text-[11px] text-[#888]">{fecha}</p></td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onViewDetails(inscrito)} className="p-1.5 text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition"><Eye className="h-3.5 w-3.5" /></button>
                        <button className="p-1.5 text-[#aaa] hover:bg-[#f0edf8] rounded-lg transition"><MoreVertical className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {inscritos.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#aaa] text-[12px]">No se encontraron inscritos con los filtros actuales.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#f5f3fb] flex items-center justify-between bg-white">
          <span className="text-[11px] text-[#aaa]">Mostrando 1 a {inscritos.length} de {inscritos.length} inscripciones{selectedIds.length > 0 && <span className="ml-2 text-[#5B4FE8] font-semibold">· {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}</span>}</span>
          <div className="flex gap-1 items-center">
            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ede9f8] text-[11px] text-[#aaa] hover:bg-[#f5f3fb] disabled:opacity-40" disabled>‹</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#5B4FE8] text-white text-[11px] font-bold">1</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ede9f8] text-[11px] text-[#aaa] hover:bg-[#f5f3fb]">2</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ede9f8] text-[11px] text-[#aaa] hover:bg-[#f5f3fb]">3</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ede9f8] text-[11px] text-[#aaa] hover:bg-[#f5f3fb]">›</button>
          </div>
        </div>
      </div>
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-[#5B4FE8] text-white rounded-full shadow-[0_4px_20px_rgba(91,79,232,0.4)] flex items-center justify-center hover:bg-[#4a3fd0] transition z-50">
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
