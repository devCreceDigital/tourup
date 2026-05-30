export type ConfigFields = {
  contactos: string[];
  empresas: string[];
  negocios: string[];
  tickets: string[];
};

export interface LandingTexts {
  serviceName1: string;
  serviceDesc1: string;
  serviceName2: string;
  serviceDesc2: string;
  ctaText: string;
}

export interface WorkspaceConfig {
  slug: string;
  isSubscriptionActive: boolean;
  isPublic: boolean;
  emailNotifications: boolean;
}

export interface CreateAgencyPayload {
  agencyType: string;
  company: {
    nombre: string; slogan: string; descripcion: string;
    mision: string; vision: string; email: string; telefono: string;
  };
  selectedTools: string[];
  configFields: ConfigFields;
  landingPhotos: string[];
  logo: string;
  landingTexts: LandingTexts;
  workspaceConfig: WorkspaceConfig;
}

export async function createAgency(payload: CreateAgencyPayload) {
  const res = await fetch("/api/onboarding/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al crear la agencia");
  return res.json() as Promise<{ success: boolean; agencyId: string; slug: string }>;
}

export function generateSlugFromName(name: string): string {
  // U+0300–U+036F: combining diacritical marks
  const diacritics = new RegExp("[̀-ͯ]", "g");
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(diacritics, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return "Mínimo 3 caracteres";
  if (slug.length > 50) return "Máximo 50 caracteres";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Solo letras minúsculas, números y guiones";
  return null;
}
