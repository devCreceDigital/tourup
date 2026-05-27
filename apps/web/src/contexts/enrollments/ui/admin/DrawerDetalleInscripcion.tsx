"use client";

import { X, User, CreditCard, FileText, BedDouble } from "lucide-react";
import { type InscripcionAPI } from "@/shared/domain/enrollment-types";

interface DrawerDetalleInscripcionProps {
  isOpen: boolean;
  onClose: () => void;
  inscrito: InscripcionAPI | null;
}

export default function DrawerDetalleInscripcion({
  isOpen,
  onClose,
  inscrito,
}: DrawerDetalleInscripcionProps) {
  if (!isOpen || !inscrito) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        <div className="px-6 py-4 border-b border-[#E0E4EF] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#1E1E4E]">Detalle de Inscripción</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F5F6FB] rounded-full transition"
          >
            <X className="h-5 w-5 text-[#888]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="h-12 w-12 rounded-full bg-[#EEF0F8] flex items-center justify-center text-[#5B5BDB]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#1E1E4E]">{inscrito.viajero_nombre}</h3>
              <p className="text-[13px] text-[#888]">{inscrito.viajero_email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-[12px] font-bold uppercase text-[#888] tracking-wider">
                Información General
              </h4>
              <div className="bg-[#F5F6FB] rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[13px] text-[#555]">Estado</span>
                  <span className="text-[13px] font-medium text-[#1E1E4E] capitalize">
                    {inscrito.estado.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[13px] text-[#555]">Viaje</span>
                  <span className="text-[13px] font-medium text-[#1E1E4E]">{inscrito.viaje_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[13px] text-[#555]">Fecha Inscripción</span>
                  <span className="text-[13px] font-medium text-[#1E1E4E]">
                    {new Date(inscrito.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[12px] font-bold uppercase text-[#888] tracking-wider">
                Estado Actual
              </h4>
              <div className="bg-[#F5F6FB] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#888]" />
                    <span className="text-[13px] text-[#555]">Pagos</span>
                  </div>
                  <span className="capitalize text-[13px] font-bold text-[#1E1E4E]">
                    {inscrito.pago_estado}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#888]" />
                    <span className="text-[13px] text-[#555]">Documentos</span>
                  </div>
                  <span className="capitalize text-[13px] font-bold text-[#1E1E4E]">
                    {inscrito.docs_estado}
                  </span>
                </div>
              </div>
            </div>

            {inscrito.tipo_habitacion && (
              <div className="space-y-3">
                <h4 className="text-[12px] font-bold uppercase text-[#888] tracking-wider">
                  Preferencias de Viaje
                </h4>
                <div className="bg-[#F5F6FB] rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <BedDouble className="h-4 w-4 text-[#888]" />
                    <div>
                      <p className="text-[12px] text-[#888]">Tipo de Habitación</p>
                      <p className="text-[13px] font-medium text-[#1E1E4E] capitalize">
                        {inscrito.tipo_habitacion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#E0E4EF] flex gap-3">
          <button className="flex-1 bg-[#5B5BDB] text-white rounded-md py-2 text-[13px] font-semibold hover:bg-[#4A4AC8] transition">
            Contactar Viajero
          </button>
          <button className="flex-1 bg-white border border-[#E0E4EF] text-[#1E1E4E] rounded-md py-2 text-[13px] font-semibold hover:bg-[#F5F6FB] transition">
            Ver Pagos
          </button>
        </div>
      </div>
    </>
  );
}
