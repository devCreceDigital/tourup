"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, Star, XCircle, CheckCircle } from "lucide-react";

interface Props {
  viajeSlug: string;
}

const OPCIONES = [
  { id: "interesa", label: "Me interesa", icon: ThumbsUp, color: "bg-green-50 border-green-300 text-green-700 hover:bg-green-100" },
  { id: "recomendaria", label: "Lo recomendaría", icon: Star, color: "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100" },
  { id: "no_interesa", label: "No me interesa", icon: XCircle, color: "bg-red-50 border-red-300 text-red-700 hover:bg-red-100" },
];

export default function ViajeDetalleFeedback({ viajeSlug }: Props) {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const handleFeedback = (opcionId: string) => {
    setSeleccion(opcionId);
    setGuardado(true);
  };

  return (
    <div className="space-y-10">
      {/* Feedback */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <p className="text-lg font-bold text-[#1E1E4E] mb-6">
          ⭐ ¿Qué te pareció este viaje?
        </p>

        {!guardado ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {OPCIONES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => handleFeedback(id)}
                className={`flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-semibold transition-all ${color}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="text-[#1E1E4E] font-semibold">
              Gracias por tu opinión, nos ayuda a mejorar la experiencia
            </p>
            <p className="text-sm text-gray-500">
              Seleccionaste:{" "}
              <span className="font-bold">
                {OPCIONES.find((o) => o.id === seleccion)?.label}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* CTA Final */}
      <div className="rounded-2xl bg-[#1E1E4E] p-8 text-center text-white">
        <h3 className="text-xl font-black mb-2">¿Listo para vivir esta aventura?</h3>
        <p className="text-indigo-300 text-sm mb-6">
          ¿Deseas reservar o recibir más información?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/viajes/${viajeSlug}/inscribirse`}
            className="rounded-xl bg-[#00B4FC] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0098d6]"
          >
            Reservar mi lugar
          </Link>
          <a
            href="#contacto"
            className="rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Recibir más información
          </a>
        </div>
      </div>
    </div>
  );
}
