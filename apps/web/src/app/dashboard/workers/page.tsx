"use client";
import { useEffect, useState } from "react";
import {
  getWorkers, addWorker, updateWorker, deleteWorker,
} from "@/lib/store/agencyStore";
import type { Worker } from "@/lib/store/agencyStore";

// ─── Constantes ────────────────────────────────────────────────────────────

type EditableRole = "admin" | "manager" | "agent";
type EditableStatus = "active" | "inactive";

const ROLE_LABELS: Record<Worker["role"], string> = {
  owner: "Propietario", admin: "Admin", manager: "Manager", agent: "Agente",
};

const ROLE_STYLES: Record<Worker["role"], { bg: string; color: string }> = {
  owner: { bg: "#0A2540", color: "#fff" },
  admin: { bg: "#DBEAFE", color: "#1E40AF" },
  manager: { bg: "#FEF3C7", color: "#92400E" },
  agent: { bg: "#F1F5F9", color: "#475569" },
};

const STATUS_STYLES: Record<Worker["status"], { bg: string; color: string; label: string }> = {
  active: { bg: "#DCFCE7", color: "#15803D", label: "Activo" },
  invited: { bg: "#FEF9C3", color: "#854D0E", label: "Invitado" },
  inactive: { bg: "#F1F5F9", color: "#475569", label: "Inactivo" },
};

const AVATAR_COLORS = ["#0A2540", "#7C3AED", "#DC2626", "#059669", "#D97706", "#2563EB"];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? "#0A2540";
}

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #E2E8F0", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#0A2540",
  boxSizing: "border-box", background: "#fff",
};

// ─── Formulario invitar ────────────────────────────────────────────────────

interface InviteForm {
  name: string;
  email: string;
  role: EditableRole;
}

interface EditForm {
  role: Worker["role"];
  status: EditableStatus;
}

// ─── Componente principal ──────────────────────────────────────────────────

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [inviteForm, setInviteForm] = useState<InviteForm>({ name: "", email: "", role: "agent" });
  const [inviteErrors, setInviteErrors] = useState<Partial<Record<keyof InviteForm, string>>>({});
  const [editForm, setEditForm] = useState<EditForm>({ role: "agent", status: "active" });

  useEffect(() => { setWorkers(getWorkers()); }, []);
  function reload() { setWorkers(getWorkers()); }

  function validateInvite(): boolean {
    const e: Partial<Record<keyof InviteForm, string>> = {};
    if (inviteForm.name.trim().length < 2) e.name = "Mínimo 2 caracteres";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inviteForm.email.trim())) e.email = "Email inválido";
    setInviteErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleInvite() {
    if (!validateInvite()) return;
    addWorker({ name: inviteForm.name.trim(), email: inviteForm.email.trim(), role: inviteForm.role, status: "invited" });
    reload();
    setShowInvite(false);
    setInviteForm({ name: "", email: "", role: "agent" });
    setInviteErrors({});
  }

  function openEdit(w: Worker) {
    setEditingWorker(w);
    const safeStatus: EditableStatus = w.status === "active" || w.status === "inactive" ? w.status : "active";
    setEditForm({ role: w.role, status: safeStatus });
  }

  function handleEditSave() {
    if (!editingWorker) return;
    updateWorker(editingWorker.id, { role: editForm.role, status: editForm.status });
    reload();
    setEditingWorker(null);
  }

  function handleDelete(id: string) {
    deleteWorker(id);
    setConfirmDelete(null);
    reload();
  }

  function handleDeactivate(w: Worker) {
    const newStatus: Worker["status"] = w.status === "active" ? "inactive" : "active";
    updateWorker(w.id, { status: newStatus });
    reload();
  }

  const isOwner = (w: Worker) => w.role === "owner";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", margin: 0 }}>Mi Equipo</h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>{workers.length} miembro{workers.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteForm({ name: "", email: "", role: "agent" }); setInviteErrors({}); }}
          style={{ background: "#D946EF", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          + Invitar trabajador
        </button>
      </div>

      {/* Lista */}
      {workers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0A2540", margin: "0 0 6px" }}>Sin trabajadores</p>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Invita a tu equipo para gestionar la agencia juntos</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {workers.map((w) => {
            const roleStyle = ROLE_STYLES[w.role];
            const statusStyle = STATUS_STYLES[w.status];
            const bgColor = avatarColor(w.name);
            return (
              <div key={w.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px" }}>
                {confirmDelete === w.id ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", margin: 0 }}>¿Eliminar a {w.name}?</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleDelete(w.id)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Sí, eliminar
                      </button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: "#fff", color: "#0A2540", border: "1px solid #E2E8F0", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{w.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</p>
                      <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{w.email}</p>
                    </div>
                    {/* Badges */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10, background: roleStyle.bg, color: roleStyle.color }}>
                        {ROLE_LABELS[w.role]}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10, background: statusStyle.bg, color: statusStyle.color }}>
                        {statusStyle.label}
                      </span>
                    </div>
                    {/* Acciones */}
                    {!isOwner(w) && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => openEdit(w)}
                          title="Editar rol"
                          style={{ width: 32, height: 32, borderRadius: 7, background: "#F7F8FA", border: "1px solid #E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDeactivate(w)}
                          title={w.status === "active" ? "Desactivar" : "Activar"}
                          style={{ width: 32, height: 32, borderRadius: 7, background: "#F7F8FA", border: "1px solid #E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: w.status === "active" ? "#F59E0B" : "#10B981" }}
                        >
                          {w.status === "active" ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(w.id)}
                          title="Eliminar"
                          style={{ width: 32, height: 32, borderRadius: 7, background: "#F7F8FA", border: "1px solid #E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal invitar */}
      {showInvite && (
        <ModalOverlay onClose={() => setShowInvite(false)}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0A2540", margin: "0 0 20px" }}>Invitar trabajador</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <FormField label="Nombre *" error={inviteErrors.name}>
              <input style={{ ...inputStyle, borderColor: inviteErrors.name ? "#EF4444" : "#E2E8F0" }} value={inviteForm.name} onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" />
            </FormField>
            <FormField label="Email *" error={inviteErrors.email}>
              <input type="email" style={{ ...inputStyle, borderColor: inviteErrors.email ? "#EF4444" : "#E2E8F0" }} value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
            </FormField>
            <FormField label="Rol">
              <select style={inputStyle} value={inviteForm.role} onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as EditableRole }))}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="agent">Agente</option>
              </select>
            </FormField>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button onClick={() => setShowInvite(false)} style={{ flex: 1, padding: "10px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 14, fontWeight: 600, background: "#fff", color: "#475569", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={handleInvite} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, background: "#D946EF", color: "#fff", cursor: "pointer" }}>
              Enviar invitación
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Modal editar */}
      {editingWorker && (
        <ModalOverlay onClose={() => setEditingWorker(null)}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0A2540", margin: "0 0 20px" }}>Editar: {editingWorker.name}</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <FormField label="Rol">
              <select style={inputStyle} value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as Worker["role"] }))}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="agent">Agente</option>
              </select>
            </FormField>
            <FormField label="Estado">
              <select style={inputStyle} value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as EditableStatus }))}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </FormField>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button onClick={() => setEditingWorker(null)} style={{ flex: 1, padding: "10px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 14, fontWeight: 600, background: "#fff", color: "#475569", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={handleEditSave} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, background: "#0A2540", color: "#fff", cursor: "pointer" }}>
              Guardar cambios
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─── Helpers UI ────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, padding: 28, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1 }}>×</button>
        {children}
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

function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function PauseIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
}
function PlayIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
}
