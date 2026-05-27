"use client";

import { Search, SlidersHorizontal, Download, Plus } from "lucide-react";

interface FiltrosInscritosProps {
  onSearch: (val: string) => void;
  onFilterChange: (key: string, val: string) => void;
  totalViajeros?: number;
  preInscritos?: number;
  pendientePago?: number;
  confirmados?: number;
  cupos?: number;
  onNuevaInscripcion?: () => void;
  onExportCSV?: () => void;
}

export default function FiltrosInscritos({
  onSearch,
  onFilterChange,
  totalViajeros = 0,
  preInscritos = 0,
  pendientePago = 0,
  confirmados = 0,
  cupos,
  onNuevaInscripcion,
  onExportCSV,
}: FiltrosInscritosProps) {
  return (
    <div className="bg-[#f0edf8]">
      <div className="px-5 pt-4 pb-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#ede9f8] p-4 flex items-center gap-3 hover:shadow-[0_4px_20px_rgba(91,79,232,0.08)] transition-shadow">
          <div className="h-11 w-11 rounded-xl bg-[#eeedfe] flex items-center justify-center flex-shrink-0">
            <svg className="h-6 w-6 text-[#5B4FE8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Total Viajeros</p>
            <div className="text-[24px] font-extrabold text-[#1a1a2e] leading-none">{totalViajeros}</div>
            <p className="text-[10px] text-[#1D9E75] font-semibold mt-0.5">↗ +12% este mes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#ede9f8] p-4 flex items-center gap-3 hover:shadow-[0_4px_20px_rgba(91,79,232,0.08)] transition-shadow">
          <div className="h-11 w-11 rounded-xl bg-[#faeeda] flex items-center justify-center flex-shrink-0">
            <svg className="h-6 w-6 text-[#BA7517]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Pre-inscritos</p>
            <div className="text-[24px] font-extrabold text-[#1a1a2e] leading-none">{preInscritos}</div>
            <p className="text-[10px] text-[#aaa] mt-0.5">Esperando validación</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#ede9f8] p-4 flex items-center gap-3 hover:shadow-[0_4px_20px_rgba(91,79,232,0.08)] transition-shadow">
          <div className="h-11 w-11 rounded-xl bg-[#fcebeb] flex items-center justify-center flex-shrink-0">
            <svg className="h-6 w-6 text-[#a32d2d]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Pendiente Pago</p>
            <div className="text-[24px] font-extrabold text-[#1a1a2e] leading-none">{pendientePago}</div>
            <p className="text-[10px] text-[#D85A30] font-semibold mt-0.5">5 Vencidos hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#ede9f8] p-4 flex items-center gap-3 hover:shadow-[0_4px_20px_rgba(91,79,232,0.08)] transition-shadow">
          <div className="h-11 w-11 rounded-xl bg-[#e1f5ee] flex items-center justify-center flex-shrink-0">
            <svg className="h-6 w-6 text-[#1D9E75]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Confirmados</p>
            <div className="text-[24px] font-extrabold text-[#1a1a2e] leading-none">{confirmados}</div>
            <p className="text-[10px] text-[#aaa] mt-0.5">{cupos ? `Capacidad al ${Math.round((confirmados / cupos) * 100)}%` : "Sin límite"}</p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#bbb]" />
          </div>
          <input type="text" placeholder="Buscar por nombre, email o ID..." className="block w-full pl-9 pr-3 py-2 border border-[#ede9f8] rounded-lg text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-[#5B4FE8]/20 focus:border-[#5B4FE8] transition" onChange={(e) => onSearch(e.target.value)} />
        </div>
        <button className="inline-flex items-center gap-2 border border-[#ede9f8] bg-white rounded-lg px-3 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
        </button>
        <select className="border border-[#ede9f8] bg-white rounded-lg text-[11px] py-2 px-3 font-medium text-[#666] focus:outline-none focus:ring-2 focus:ring-[#5B4FE8]/20 focus:border-[#5B4FE8] transition" onChange={(e) => onFilterChange("pago", e.target.value)}>
          <option value="">Todos los Pagos</option>
          <option value="completo">Completos</option>
          <option value="parcial">Parciales</option>
          <option value="pendiente">Pendientes</option>
        </select>
        <select className="border border-[#ede9f8] bg-white rounded-lg text-[11px] py-2 px-3 font-medium text-[#666] focus:outline-none focus:ring-2 focus:ring-[#5B4FE8]/20 focus:border-[#5B4FE8] transition" onChange={(e) => onFilterChange("documentos", e.target.value)}>
          <option value="">Todos los Docs</option>
          <option value="completo">Completos</option>
          <option value="incompleto">Incompletos</option>
          <option value="faltante">Faltantes</option>
          <option value="pendiente">Pendientes</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={onExportCSV} className="inline-flex items-center gap-2 border border-[#ede9f8] bg-white rounded-lg px-3 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
          <button onClick={onNuevaInscripcion} className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[11px] font-bold hover:bg-[#4a3fd0] transition">
            <Plus className="h-3.5 w-3.5" /> Nueva Inscripción
          </button>
        </div>
      </div>
    </div>
  );
}
