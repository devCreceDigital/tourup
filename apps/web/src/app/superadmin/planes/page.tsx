"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, XCircle } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_trips: number;
  max_inscriptions: number;
  is_active: boolean;
  created_at: string;
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestTotemApi("/subscriptions/plans")
      .then(r => r.json())
      .then((d) => setPlanes(d.results ?? d ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de suscripción</h1>
          <p className="text-gray-500 text-sm mt-1">{planes.length} planes configurados</p>
        </div>
        
        <a
          target="_blank"
          className="px-4 py-2 bg-[#5B4FE8] text-white text-sm rounded-lg hover:bg-[#4a3fd4] transition-colors"
        >
          + Nuevo plan
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#ede9f8] p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-32 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-20 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : planes.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#ede9f8] p-16 text-center text-gray-400">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No hay planes configurados en el servicio de suscripciones.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {planes.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border shadow-[0_4px_24px_rgba(91,79,232,0.08)] p-6 ${
                p.is_active ? "border-[#ede9f8]" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                {p.is_active ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-300" />
                )}
              </div>
              <div className="mb-4">
                <p className="text-3xl font-bold text-[#5B4FE8]">
                  S/ {p.price_monthly}
                  <span className="text-sm font-normal text-gray-400">/mes</span>
                </p>
                {p.price_yearly > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    S/ {p.price_yearly}/año
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>
              <div className="space-y-1.5 text-xs text-gray-500 border-t border-[#ede9f8] pt-4">
                <div className="flex justify-between">
                  <span>Viajes máx.</span>
                  <span className="font-medium text-gray-700">{p.max_trips === 0 ? "Ilimitado" : p.max_trips}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inscripciones máx.</span>
                  <span className="font-medium text-gray-700">{p.max_inscriptions === 0 ? "Ilimitado" : p.max_inscriptions}</span>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 block w-full text-center text-xs text-[#5B4FE8] hover:underline"
              >
                Editar plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
