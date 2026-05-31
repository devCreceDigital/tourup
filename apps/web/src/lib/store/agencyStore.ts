// ─── Agency Store — persiste en localStorage ───────────────────────────────

export interface AgencyData {
  id: string;
  slug: string;
  agencyType: string;
  nombre: string;
  slogan: string;
  descripcion: string;
  mision: string;
  vision: string;
  email: string;
  telefono: string;
  logo: string;
  landingPhotos: string[];
  landingTexts: {
    serviceName1: string;
    serviceDesc1: string;
    serviceName2: string;
    serviceDesc2: string;
    ctaText: string;
  };
  selectedTools: string[];
  isPublic: boolean;
  emailNotifications: boolean;
  subscriptionPlan: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  dateStart: string;
  dateEnd: string;
  durationDays: number;
  priceFrom: number;
  priceTo: number;
  currency: string;
  activities: string[];
  includes: string[];
  travelerTypes: string[];
  maxCapacity: number;
  type: string;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "agent";
  status: "active" | "invited" | "inactive";
  joinedAt: string;
}

export interface AgencyStore {
  agency: AgencyData | null;
  trips: Trip[];
  workers: Worker[];
}

const STORE_KEY = "traventia_store";

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

const EMPTY_STORE: AgencyStore = {
  agency: null,
  trips: [],
  workers: [],
};

export function loadStore(): AgencyStore {
  if (typeof window === "undefined") return { ...EMPTY_STORE };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY_STORE };
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "agency" in parsed &&
      "trips" in parsed &&
      "workers" in parsed
    ) {
      return parsed as AgencyStore;
    }
    return { ...EMPTY_STORE };
  } catch {
    return { ...EMPTY_STORE };
  }
}

export function saveStore(store: AgencyStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignora errores de cuota
  }
}

// ─── Agency ────────────────────────────────────────────────────────────────

export function getAgency(): AgencyData | null {
  return loadStore().agency;
}

export function saveAgency(agency: AgencyData): void {
  const store = loadStore();
  saveStore({ ...store, agency });
}

// ─── Trips ─────────────────────────────────────────────────────────────────

export function getTrips(): Trip[] {
  return loadStore().trips;
}

export function addTrip(trip: Omit<Trip, "id" | "createdAt" | "updatedAt">): Trip {
  const store = loadStore();
  const now = new Date().toISOString();
  const newTrip: Trip = { ...trip, id: uid(), createdAt: now, updatedAt: now };
  saveStore({ ...store, trips: [...store.trips, newTrip] });
  return newTrip;
}

export function updateTrip(
  id: string,
  data: Partial<Omit<Trip, "id" | "createdAt">>
): Trip | null {
  const store = loadStore();
  let found: Trip | null = null;
  const trips = store.trips.map((t) => {
    if (t.id === id) {
      const updated: Trip = { ...t, ...data, updatedAt: new Date().toISOString() };
      found = updated;
      return updated;
    }
    return t;
  });
  saveStore({ ...store, trips });
  return found;
}

export function deleteTrip(id: string): void {
  const store = loadStore();
  saveStore({ ...store, trips: store.trips.filter((t) => t.id !== id) });
}

// ─── Workers ───────────────────────────────────────────────────────────────

export function getWorkers(): Worker[] {
  return loadStore().workers;
}

export function addWorker(worker: Omit<Worker, "id" | "joinedAt">): Worker {
  const store = loadStore();
  const newWorker: Worker = {
    ...worker,
    id: uid(),
    joinedAt: new Date().toISOString(),
  };
  saveStore({ ...store, workers: [...store.workers, newWorker] });
  return newWorker;
}

export function updateWorker(
  id: string,
  data: Partial<Omit<Worker, "id" | "joinedAt">>
): Worker | null {
  const store = loadStore();
  let found: Worker | null = null;
  const workers = store.workers.map((w) => {
    if (w.id === id) {
      const updated: Worker = { ...w, ...data };
      found = updated;
      return updated;
    }
    return w;
  });
  saveStore({ ...store, workers });
  return found;
}

export function deleteWorker(id: string): void {
  const store = loadStore();
  saveStore({ ...store, workers: store.workers.filter((w) => w.id !== id) });
}

// ─── Utilities ─────────────────────────────────────────────────────────────

export function clearStore(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORE_KEY);
}
