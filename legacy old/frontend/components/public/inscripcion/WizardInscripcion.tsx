"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepBar, { type Step } from "@/components/admin/StepBar";
import { User, HeartPulse, CreditCard, ShieldCheck, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { fetchDjango } from "@/lib/api";

interface WizardInscripcionProps {
  viajeSlug: string;
  viajeNombre: string;
  precioBase: number;
}

export default function WizardInscripcion({ viajeSlug, viajeNombre, precioBase }: WizardInscripcionProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    fechaNacimiento: "",
    alergias: "",
    restricciones: "",
    habitacion: "multiple",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const steps: Step[] = [
    { label: "Datos Personales", status: currentStep > 1 ? "done" : currentStep === 1 ? "active" : "pending" },
    { label: "Salud y Preferencias", status: currentStep > 2 ? "done" : currentStep === 2 ? "active" : "pending" },
    { label: "Pago", status: currentStep > 3 ? "done" : currentStep === 3 ? "active" : "pending" },
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!formData.apellidos.trim()) errs.apellidos = "Los apellidos son obligatorios";
    if (!formData.dni.trim()) errs.dni = "El DNI/Pasaporte es obligatorio";
    if (!formData.email.trim()) errs.email = "El correo es obligatorio";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(formData.email)) errs.email = "Correo inválido";
    if (!formData.telefono.trim()) errs.telefono = "El teléfono es obligatorio";
    if (!formData.fechaNacimiento) errs.fechaNacimiento = "La fecha de nacimiento es obligatoria";
    return errs;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }
    setErrors({});
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };
  const handlePrev = () => { if (currentStep > 1) setCurrentStep((prev) => prev - 1); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetchDjango(`/public/viajes/${viajeSlug}/inscribirse/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Datos del pasajero (Perfil)
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          dni: formData.dni,
          email: formData.email,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fechaNacimiento,
          
          // Datos de la inscripción
          tipo_habitacion: formData.habitacion,
          datos_salud: {
            alergias: formData.alergias || null,
            restricciones_alimentarias: formData.restricciones || null,
          }
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Error al procesar la inscripción");
      }

      const data = await res.json();
      
      // Si el backend nos devolvió datos de sesión (token), los guardamos
      if (data.auth?.access_token) {
        localStorage.setItem("totem_token", data.auth.access_token);
        localStorage.setItem("totem_user", JSON.stringify(data.auth.user));
        // Disparar evento para que otros componentes se enteren si es necesario
        window.dispatchEvent(new Event("storage"));
      }

      // Crear pago pendiente automaticamente
      if (data.id && precioTotal > 0) {
        try {
          await fetchDjango(`/inscripciones/${data.id}/pagos/manual/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              monto: precioTotal,
              metodo: "pendiente",
              referencia: "",
              notas: "Pago pendiente generado al inscribirse",
            }),
          });
        } catch { /* inscripcion ya creada */ }
      }
      router.push("/viajero");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error inesperado. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const recargoHabitacion = formData.habitacion === "simple" ? 50 : formData.habitacion === "doble" ? 25 : 0;
  const precioTotal = precioBase + recargoHabitacion;

  return (
    <div className="max-w-3xl mx-auto w-full bg-white rounded-xl border border-[#E0E4EF] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#1E1E4E] text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Inscripción al Viaje</h1>
        <p className="text-white/80 text-sm">Estás inscribiéndote a: <span className="font-semibold text-white">{viajeNombre}</span></p>
      </div>

      <div className="p-6">
        <StepBar steps={steps} />

        <div className="mt-8 min-h-[350px]">
          {/* PASO 1: Datos Personales */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-6 text-[#1E1E4E]">
                <User className="h-5 w-5 text-[#5B5BDB]" />
                <h2 className="text-lg font-bold">Datos del Pasajero</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Nombres</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition"
                    placeholder="Ej. Juan Carlos" />
                  {errors.nombre && <p className="text-[11px] text-red-500 mt-1">{errors.nombre}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Apellidos</label>
                  <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition"
                    placeholder="Ej. Pérez Gómez" />
                  {errors.apellidos && <p className="text-[11px] text-red-500 mt-1">{errors.apellidos}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">DNI / Pasaporte</label>
                  <input type="text" name="dni" value={formData.dni} onChange={handleChange}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition"
                    placeholder="Número de documento" />
                  {errors.dni && <p className="text-[11px] text-red-500 mt-1">{errors.dni}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition text-[#1E1E4E]" />
                  {errors.fechaNacimiento && <p className="text-[11px] text-red-500 mt-1">{errors.fechaNacimiento}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Correo Electrónico</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition"
                    placeholder="correo@ejemplo.com" />
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Teléfono / WhatsApp</label>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition"
                    placeholder="+51 999 999 999" />
                  {errors.telefono && <p className="text-[11px] text-red-500 mt-1">{errors.telefono}</p>}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Salud y Preferencias */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-2 text-[#1E1E4E]">
                <HeartPulse className="h-5 w-5 text-[#5B5BDB]" />
                <h2 className="text-lg font-bold">Salud y Preferencias</h2>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Alergias o Condiciones Médicas</label>
                  <textarea name="alergias" value={formData.alergias} onChange={handleChange} rows={3}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition resize-none"
                    placeholder="Indique si tiene alergias a medicamentos, asma, diabetes, etc. (Opcional)" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Restricciones Alimentarias</label>
                  <select name="restricciones" value={formData.restricciones} onChange={handleChange}
                    className="w-full border border-[#E0E4EF] bg-[#F5F6FB] rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-[#5B5BDB] focus:bg-white transition">
                    <option value="">Ninguna</option>
                    <option value="vegetariano">Vegetariano</option>
                    <option value="vegano">Vegano</option>
                    <option value="celiaco">Celíaco / Sin Gluten</option>
                    <option value="intolerante_lactosa">Intolerante a la Lactosa</option>
                  </select>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-[#E0E4EF]">
                  <label className="text-[13px] font-medium text-[#1E1E4E]">Preferencia de Habitación</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {[
                      { value: "multiple", label: "Múltiple", sub: "Incluido" },
                      { value: "doble", label: "Doble", sub: "+ $25.00" },
                      { value: "simple", label: "Simple", sub: "+ $50.00" },
                    ].map(({ value, label, sub }) => (
                      <label key={value} className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition ${formData.habitacion === value ? "border-[#5B5BDB] bg-[#EEF0F8] text-[#5B5BDB]" : "border-[#E0E4EF] hover:bg-[#F5F6FB] text-[#888]"}`}>
                        <input type="radio" name="habitacion" value={value} checked={formData.habitacion === value} onChange={handleChange} className="sr-only" />
                        <span className="text-[14px] font-bold text-center">{label}</span>
                        <span className="text-[11px]">{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Resumen y Pago */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-2 text-[#1E1E4E]">
                <CreditCard className="h-5 w-5 text-[#5B5BDB]" />
                <h2 className="text-lg font-bold">Resumen y Pago</h2>
              </div>
              <div className="bg-[#F5F6FB] border border-[#E0E4EF] rounded-lg p-5">
                <h3 className="text-[14px] font-bold text-[#1E1E4E] mb-4 border-b border-[#E0E4EF] pb-2">Resumen de tu reserva</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#555]">Pasajero</span>
                    <span className="font-medium text-[#1E1E4E]">{formData.nombre || "No ingresado"} {formData.apellidos}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#555]">Paquete Base</span>
                    <span className="font-medium text-[#1E1E4E]">$ {precioBase.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#555]">Habitación ({formData.habitacion})</span>
                    <span className="font-medium text-[#1E1E4E]">{recargoHabitacion > 0 ? `+ $ ${recargoHabitacion.toFixed(2)}` : "Incluido"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-[#E0E4EF] pt-4">
                  <span className="text-[15px] font-bold text-[#1E1E4E]">Total a Pagar hoy</span>
                  <span className="text-[24px] font-bold text-[#1A8A4A]">$ {precioTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-[#E3F9EC] border border-[#1A8A4A]/20 rounded-lg p-4 flex gap-3">
                <ShieldCheck className="h-6 w-6 text-[#1A8A4A] shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-[#1A8A4A]">Pago 100% Seguro</p>
                  <p className="text-[12px] text-[#1A8A4A]/80">Tu transacción está encriptada y procesada por MercadoPago. No guardamos los datos de tu tarjeta.</p>
                </div>
              </div>
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-[#E0E4EF] flex justify-between items-center">
          <button onClick={handlePrev} disabled={currentStep === 1 || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-[14px] font-semibold text-[#555] hover:bg-[#F5F6FB] transition disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
          {currentStep < 3 ? (
            <button onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#5B5BDB] text-white text-[14px] font-bold hover:bg-[#4A4AC8] transition shadow-sm">
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 rounded-md bg-[#1A8A4A] text-white text-[14px] font-bold hover:bg-[#14703C] transition shadow-md disabled:opacity-70 disabled:cursor-wait">
              {isSubmitting ? "Procesando..." : <><CreditCard className="h-4 w-4" /> Confirmar y Pagar</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
