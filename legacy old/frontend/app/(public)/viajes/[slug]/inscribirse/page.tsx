import WizardInscripcion from "@/components/public/inscripcion/WizardInscripcion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchDjango } from "@/lib/api";

async function fetchViajeBasico(slug: string): Promise<{ nombre: string; precioBase: number }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/public/viajes/${slug}/`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const config = data.configuracion ?? {};
      const detalle = config.precios_detalle;
      const precioBase = Array.isArray(detalle) && detalle.length > 0
        ? (detalle[0].monto ?? detalle[0].precio ?? 0)
        : (config.precio_base ?? config.precio_desde ?? 0);
      return {
        nombre: data.nombre ?? slug,
        precioBase,
      };
    }
  } catch { /* fallback */ }
  return { nombre: slug, precioBase: 0 };
}

export default async function InscripcionPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { nombre, precioBase } = await fetchViajeBasico(slug);

  return (
    <div className="min-h-screen bg-[#F5F6FB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto mb-6">
        <Link
          href={`/viajes/${slug}`}
          className="inline-flex items-center gap-2 text-[#5B5BDB] hover:underline text-[14px] font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a los detalles del viaje
        </Link>
      </div>

      <WizardInscripcion
        viajeSlug={slug}
        viajeNombre={nombre}
        precioBase={precioBase}
      />
    </div>
  );
}
