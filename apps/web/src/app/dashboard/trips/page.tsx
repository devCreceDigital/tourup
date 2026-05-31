"use client";
import { useEffect, useState } from "react";
import {
  getTrips, addTrip, updateTrip, deleteTrip,
} from "@/lib/store/agencyStore";
import type { Trip } from "@/lib/store/agencyStore";

// ─── Constantes ────────────────────────────────────────────────────────────

const TRIP_TYPES = ["Aventura", "Playa", "Cultural", "Lujo", "Negocios", "Familiar", "Grupos", "Otro"] as const;
const CURRENCIES = ["USD", "EUR", "COP", "MXN", "ARS", "PEN", "CLP"] as const;
const INCLUDES_OPTIONS = ["Vuelos", "Hotel", "Traslados", "Guía", "Comidas", "Seguro"] as const;
const TRAVELER_TYPES = ["Familias", "Parejas", "Grupos", "Solo", "Corporativo", "Aventureros"] as const;

const TYPE_EMOJI: Record<string, string> = {
  Aventura: "🧗", Playa: "🏖️", Cultural: "🏛️", Lujo: "💎",
  Negocios: "💼", Familiar: "👨‍👩‍👧", Grupos: "👥", Otro: "✈️",
};

// ─── Formulario vacío ──────────────────────────────────────────────────────

function emptyForm(): Omit<Trip, "id" | "createdAt" | "updatedAt"> {
  return {
    title: "", description: "", destination: "", dateStart: "", dateEnd: "",
    durationDays: 1, priceFrom: 0, priceTo: 0, currency: "USD",
    activities: [], includes: [], travelerTypes: [], maxCapacity: 10,
    type: "Aventura", status: "draft",
  };
}

// ─── Tipos internos ────────────────────────────────────────────────────────

type FilterType = "all" | "published" | "draft";

interface FormState extends Omit<Trip, "id" | "createdAt" | "updatedAt"> {
  activitiesInput: string;
}

function formToTrip(f: FormState): Omit<Trip, "id" | "createdAt" | "updatedAt"> {
  const { activitiesInput: _ai, ...rest } = f;
  void _ai;
  return rest;
}

// ─── Estilos base ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #E2E8F0", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#0A2540", boxSizing: "border-box",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5,
};

// ─── Componente principal ──────────────────────────────────────────────────

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({ ...emptyForm(), activitiesInput: "" });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => { setTrips(getTrips()); }, []);

  function reload() { setTrips(getTrips()); }

  function openNew() {
    setEditingTrip(null);
    setForm({ ...emptyForm(), activitiesInput: "" });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(trip: Trip) {
    setEditingTrip(trip);
    setForm({
      title: trip.title, description: trip.description, destination: trip.destination,
      dateStart: trip.dateStart, dateEnd: trip.dateEnd, durationDays: trip.durationDays,
      priceFrom: trip.priceFrom, priceTo: trip.priceTo, currency: trip.currency,
      activities: trip.activities, includes: trip.includes, travelerTypes: trip.travelerTypes,
      maxCapacity: trip.maxCapacity, type: trip.type, status: trip.status,
      activitiesInput: "",
    });
    setErrors({});
    setShowModal(true);
  }

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (form.title.trim().length < 3) e["title"] = "Mínimo 3 caracteres";
    if (!form.destination.trim()) e["destination"] = "Requerido";
    if (form.priceFrom <= 0) e["priceFrom"] = "Precio debe ser mayor a 0";
    if (form.durationDays < 1) e["durationDays"] = "Mínimo 1 día";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const tripData = formToTrip(form);
    if (editingTrip) {
      updateTrip(editingTrip.id, tripData);
    } else {
      addTrip(tripData);
    }
    reload();
    setShowModal(false);
  }

  function handleToggleStatus(trip: Trip) {
    const newStatus: Trip["status"] = trip.status === "published" ? "draft" : "published";
    updateTrip(trip.id, { status: newStatus });
    reload();
  }

  function handleDelete(id: string) {
    deleteTrip(id);
    setConfirmDelete(null);
    reload();
  }

  function toggleInclude(val: string) {
    setForm((f) => ({
      ...f,
      includes: f.includes.includes(val) ? f.includes.filter((i) => i !== val) : [...f.includes, val],
    }));
  }

  function toggleTraveler(val: string) {
    setForm((f) => ({
      ...f,
      travelerTypes: f.travelerTypes.includes(val)
        ? f.travelerTypes.filter((t) => t !== val)
        : [...f.travelerTypes, val],
    }));
  }

  function addActivity() {
    const val = form.activitiesInput.trim();
    if (val && !form.activities.includes(val)) {
      setForm((f) => ({ ...f, activities: [...f.activities, val], activitiesInput: "" }));
    }
  }

  function removeActivity(a: string) {
    setForm((f) => ({ ...f, activities: f.activities.filter((x) => x !== a) }));
  }

  const filtered = trips.filter((t) =>
    filter === "all" ? true : filter === "published" ? t.status === "published" : t.status === "draft"
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", margin: 0 }}>Mis Viajes</h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>{trips.length} viaje{trips.length !== 1 ? "s" : ""} en total</p>
        </div>
        <button
          onClick={openNew}
          style={{ background: "#D946EF", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <span>+</span> Nuevo viaje
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "published", "draft"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid", borderColor: filter === f ? "#0A2540" : "#E2E8F0", background: filter === f ? "#0A2540" : "#fff", color: filter === f ? "#fff" : "#475569" }}
          >
            {f === "all" ? "Todos" : f === "published" ? "Publicados" : "Borradores"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✈️</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0A2540", margin: "0 0 6px" }}>Sin viajes aún</p>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Crea tu primer viaje para empezar a recibir clientes</p>
          <button onClick={openNew} style={{ background: "#D946EF", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Crear primer viaje
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onEdit={() => openEdit(trip)}
              onToggle={() => handleToggleStatus(trip)}
              onDelete={() => setConfirmDelete(trip.id)}
              confirmingDelete={confirmDelete === trip.id}
              onConfirmDelete={() => handleDelete(trip.id)}
              onCancelDelete={() => setConfirmDelete(null)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TripModal
          form={form}
          setForm={setForm}
          errors={errors}
          editingTitle={editingTrip?.title}
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          toggleInclude={toggleInclude}
          toggleTraveler={toggleTraveler}
          addActivity={addActivity}
          removeActivity={removeActivity}
        />
      )}
    </div>
  );
}

// ─── TripCard ──────────────────────────────────────────────────────────────

interface TripCardProps {
  trip: Trip;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function TripCard({ trip, onEdit, onToggle, onDelete, confirmingDelete, onConfirmDelete, onCancelDelete }: TripCardProps) {
  const emoji = TYPE_EMOJI[trip.type] ?? "✈️";
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px" }}>
      {confirmingDelete ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", margin: 0 }}>¿Eliminar este viaje?</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onConfirmDelete} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sí, eliminar
            </button>
            <button onClick={onCancelDelete} style={{ background: "#fff", color: "#0A2540", border: "1px solid #E2E8F0", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</p>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, flexShrink: 0, background: trip.status === "published" ? "#DCFCE7" : "#F1F5F9", color: trip.status === "published" ? "#15803D" : "#64748B" }}>
                {trip.status === "published" ? "Publicado" : "Borrador"}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
              📍 {trip.destination}
              {trip.dateStart && ` · ${trip.dateStart}`}
              {" · "}{trip.currency} {trip.priceFrom.toLocaleString()}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <IconButton title="Editar" onClick={onEdit} color="#3B82F6">
              <PencilIcon />
            </IconButton>
            <IconButton title={trip.status === "published" ? "Despublicar" : "Publicar"} onClick={onToggle} color={trip.status === "published" ? "#F59E0B" : "#10B981"}>
              {trip.status === "published" ? <EyeOffIcon /> : <EyeIcon />}
            </IconButton>
            <IconButton title="Eliminar" onClick={onDelete} color="#EF4444">
              <TrashIcon />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({ title, onClick, color, children }: { title: string; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{ width: 34, height: 34, borderRadius: 8, background: "#F7F8FA", border: "1px solid #E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color }}
    >
      {children}
    </button>
  );
}

function PencilIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function EyeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}

// ─── TripModal ─────────────────────────────────────────────────────────────

interface TripModalProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Partial<Record<string, string>>;
  editingTitle: string | undefined;
  onSave: () => void;
  onCancel: () => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  toggleInclude: (val: string) => void;
  toggleTraveler: (val: string) => void;
  addActivity: () => void;
  removeActivity: (a: string) => void;
}

function TripModal({ form, setForm, errors, editingTitle, onSave, onCancel, inputStyle, labelStyle, toggleInclude, toggleTraveler, addActivity, removeActivity }: TripModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0A2540", margin: 0 }}>
            {editingTitle ? `Editar: ${editingTitle}` : "Nuevo viaje"}
          </h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94A3B8", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Título */}
          <FormField label="Título *" error={errors["title"]}>
            <input style={{ ...inputStyle, borderColor: errors["title"] ? "#EF4444" : "#E2E8F0" }} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej: Tour Machu Picchu 7 días" />
          </FormField>

          {/* Descripción */}
          <FormField label="Descripción">
            <textarea style={{ ...inputStyle, minHeight: 80, fontFamily: "inherit", resize: "vertical" }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe la experiencia..." />
          </FormField>

          {/* Destino + Tipo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Destino *" error={errors["destination"]}>
              <input style={{ ...inputStyle, borderColor: errors["destination"] ? "#EF4444" : "#E2E8F0" }} value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} placeholder="Ej: Cusco, Perú" />
            </FormField>
            <FormField label="Tipo">
              <select style={inputStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {TRIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
          </div>

          {/* Fechas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <FormField label="Fecha inicio">
              <input type="date" style={inputStyle} value={form.dateStart} onChange={(e) => setForm((f) => ({ ...f, dateStart: e.target.value }))} />
            </FormField>
            <FormField label="Fecha fin">
              <input type="date" style={inputStyle} value={form.dateEnd} onChange={(e) => setForm((f) => ({ ...f, dateEnd: e.target.value }))} />
            </FormField>
            <FormField label="Días" error={errors["durationDays"]}>
              <input type="number" style={{ ...inputStyle, borderColor: errors["durationDays"] ? "#EF4444" : "#E2E8F0" }} value={form.durationDays} min={1} onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))} />
            </FormField>
          </div>

          {/* Precios */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <FormField label="Precio desde *" error={errors["priceFrom"]}>
              <input type="number" style={{ ...inputStyle, borderColor: errors["priceFrom"] ? "#EF4444" : "#E2E8F0" }} value={form.priceFrom} min={0} onChange={(e) => setForm((f) => ({ ...f, priceFrom: Number(e.target.value) }))} />
            </FormField>
            <FormField label="Precio hasta">
              <input type="number" style={inputStyle} value={form.priceTo} min={0} onChange={(e) => setForm((f) => ({ ...f, priceTo: Number(e.target.value) }))} />
            </FormField>
            <FormField label="Moneda">
              <select style={inputStyle} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>

          {/* Capacidad */}
          <FormField label="Capacidad máxima">
            <input type="number" style={inputStyle} value={form.maxCapacity} min={1} onChange={(e) => setForm((f) => ({ ...f, maxCapacity: Number(e.target.value) }))} />
          </FormField>

          {/* Actividades */}
          <div>
            <label style={labelStyle}>Actividades</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={form.activitiesInput}
                onChange={(e) => setForm((f) => ({ ...f, activitiesInput: e.target.value }))}
                placeholder="Ej: Trekking"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addActivity(); } }}
              />
              <button onClick={addActivity} style={{ padding: "9px 16px", background: "#0A2540", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {form.activities.map((a) => (
                <span key={a} style={{ fontSize: 12, background: "#EEF2F7", color: "#0A2540", padding: "4px 10px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4 }}>
                  {a}
                  <button onClick={() => removeActivity(a)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Incluye */}
          <div>
            <label style={labelStyle}>Incluye</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INCLUDES_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleInclude(opt)}
                  style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, cursor: "pointer", border: "1px solid", borderColor: form.includes.includes(opt) ? "#0A2540" : "#E2E8F0", background: form.includes.includes(opt) ? "#0A2540" : "#fff", color: form.includes.includes(opt) ? "#fff" : "#475569", fontWeight: 500 }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo viajeros */}
          <div>
            <label style={labelStyle}>Tipo de viajeros</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TRAVELER_TYPES.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleTraveler(opt)}
                  style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, cursor: "pointer", border: "1px solid", borderColor: form.travelerTypes.includes(opt) ? "#D946EF" : "#E2E8F0", background: form.travelerTypes.includes(opt) ? "#D946EF" : "#fff", color: form.travelerTypes.includes(opt) ? "#fff" : "#475569", fontWeight: 500 }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div>
            <label style={labelStyle}>Estado</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["published", "draft"] as Trip["status"][]).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid", borderColor: form.status === s ? (s === "published" ? "#10B981" : "#64748B") : "#E2E8F0", background: form.status === s ? (s === "published" ? "#DCFCE7" : "#F1F5F9") : "#fff", color: form.status === s ? (s === "published" ? "#15803D" : "#374151") : "#94A3B8", fontWeight: 600 }}
                >
                  {s === "published" ? "Publicado" : "Borrador"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "#fff", color: "#475569", cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={onSave} style={{ flex: 2, padding: "11px", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, background: "#0A2540", color: "#fff", cursor: "pointer" }}>
            Guardar viaje
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>{label}</label>
      {children}
      {error != null && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}
