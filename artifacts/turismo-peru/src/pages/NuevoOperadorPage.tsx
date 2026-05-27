import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateOperator } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, MapPin, Globe, Phone } from "lucide-react";

const schema = z.object({
  legal_name: z.string().min(3, "Nombre legal requerido"),
  commercial_name: z.string().min(2, "Nombre comercial requerido"),
  ruc: z.string().optional(),
  region: z.string().min(1, "Selecciona una región"),
  province: z.string().optional(),
  district: z.string().optional(),
  operator_type: z.string().min(1, "Selecciona el tipo de operador"),
  niche: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const REGIONS = [
  "Lima", "Cusco", "Arequipa", "Puno", "Ica", "Piura",
  "Loreto", "Madre de Dios", "La Libertad", "Junín", "Ancash",
  "Cajamarca", "Lambayeque", "Tacna", "Moquegua", "Tumbes",
  "Ucayali", "Huánuco", "Ayacucho", "Apurímac",
];
const OPERATOR_TYPES = [
  "Agencia Viajes", "Tour Operador", "Hotel Lodge", "Lodge",
  "Hostal y Tours", "Lodge Amazónico", "Operador Deportivo",
  "Operador MICE", "Restaurante Turístico", "Transporte Turístico",
];
const NICHES = [
  "Ecoturismo", "Trekking", "Turismo Aventura", "Turismo Receptivo",
  "Turismo Cultural", "Lujo", "Turismo Gastronómico", "Turismo Vivencial",
  "Turismo Amazónico", "Surf y Playa", "Turismo de Naturaleza",
  "Turismo Rural", "Glamping", "Wellness", "MICE",
];

export default function NuevoOperadorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const create = useCreateOperator();
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      legal_name: "",
      commercial_name: "",
      ruc: "",
      region: "",
      province: "",
      district: "",
      operator_type: "",
      niche: "",
      website: "",
      description: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        data: {
          legal_name: values.legal_name,
          commercial_name: values.commercial_name,
          ruc: values.ruc || undefined,
          region: values.region,
          province: values.province || undefined,
          district: values.district || undefined,
          operator_type: values.operator_type,
          niche: values.niche || undefined,
          website: values.website || undefined,
          description: values.description || undefined,
          phone: values.phone || undefined,
          email: values.email || undefined,
        },
      },
      {
        onSuccess: (op) => {
          toast({ title: "Operador registrado exitosamente", description: op.commercial_name });
          setLocation(`/operadores/${op.id}`);
        },
        onError: () => {
          toast({ title: "Error al registrar operador", variant: "destructive" });
        },
      }
    );
  };

  const nextStep = async () => {
    const fieldsStep1 = ["legal_name", "commercial_name", "ruc"] as const;
    const fieldsStep2 = ["region", "operator_type"] as const;
    const valid = await form.trigger(step === 1 ? fieldsStep1 : fieldsStep2);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => setLocation("/directorio")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="btn-back-nuevo"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div>
        <h1 className="text-2xl font-bold">Registrar Nuevo Operador</h1>
        <p className="text-sm text-muted-foreground">
          Agrega un prestador turístico al directorio inteligente
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                s <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`h-px w-8 ${s < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
        <div className="ml-2 text-xs text-muted-foreground">
          {step === 1 && "Datos legales"}
          {step === 2 && "Ubicación y tipo"}
          {step === 3 && "Contacto y descripción"}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Datos de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="commercial_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Comercial *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Inkaterra Hotels" {...field} data-testid="input-commercial-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="legal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social / Nombre Legal *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Inkaterra Asociación SAC" {...field} data-testid="input-legal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ruc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUC (SUNAT)</FormLabel>
                      <FormControl>
                        <Input placeholder="20XXXXXXXXX" {...field} data-testid="input-ruc" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Ubicación y Categoría
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Región *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-region">
                            <SelectValue placeholder="Selecciona región" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Cusco" {...field} data-testid="input-province" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distrito</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Miraflores" {...field} data-testid="input-district" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="operator_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Operador *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-operator-type">
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OPERATOR_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nicho / Especialidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-niche">
                            <SelectValue placeholder="Selecciona nicho (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NICHES.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Contacto y Presencia Digital
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio Web</FormLabel>
                      <FormControl>
                        <Input placeholder="https://ejemplo.com" {...field} data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+51 1 2345678" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="info@empresa.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Operador</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe los servicios y especialidades del operador..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                data-testid="btn-prev-step"
              >
                Anterior
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                data-testid="btn-next-step"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={create.isPending}
                data-testid="btn-submit-operator"
              >
                {create.isPending ? "Registrando..." : "Registrar Operador"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
