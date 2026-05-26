"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchDjango } from "@/lib/api";

interface Notificacion {
  id: string;
  titulo: string;
  cuerpo: string;
  tipo: "info" | "accion" | "alerta";
  created_at: string;
  leida: boolean;
  link?: string | null;
}

export default function AdminNotificacionesPage() {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const noLeidas = useMemo(() => items.filter((i) => !i.leida).length, [items]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchDjango("/notificaciones/");
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];
      setItems(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, []);

  const marcar = async (ids: string[], leida: boolean) => {
    await fetchDjango("/notificaciones/marcar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, leida }),
    });
  };

  const toggleLeida = async (id: string) => {
    const current = items.find((x) => x.id === id);
    if (!current) return;
    const next = !current.leida;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: next } : n)));
    await marcar([id], next);
  };

  const marcarTodo = async (leida: boolean) => {
    const ids = items.map((n) => n.id);
    setItems((prev) => prev.map((n) => ({ ...n, leida })));
    await marcar(ids, leida);
  };

  const getTipoBadge = (tipo: Notificacion["tipo"]) => {
    if (tipo === "accion") return <Badge variant="blue">Acción</Badge>;
    if (tipo === "alerta") return <Badge variant="red">Alerta</Badge>;
    return <Badge variant="gray">Info</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600">Pendientes: {noLeidas}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/reservas">
            <Button variant="outline">Ir a Inscripciones</Button>
          </Link>
          <Button variant="outline" onClick={() => void marcarTodo(true)} disabled={!items.length}>
            Marcar leídas
          </Button>
          <Button onClick={() => void marcarTodo(false)} className="bg-[#5B4FE8] hover:bg-[#4a3fd0]" disabled={!items.length}>
            Marcar no leídas
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {loading ? (
            <div className="p-4">
              <p className="text-sm text-gray-600">Cargando…</p>
            </div>
          ) : items.length ? (
            items.map((n) => (
              <div key={n.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {n.leida ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : n.tipo === "alerta" ? (
                      <Bell className="h-5 w-5 text-rose-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-[#00B4FC]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{n.titulo}</p>
                      {getTipoBadge(n.tipo)}
                      {!n.leida ? <Badge variant="orange">Nueva</Badge> : null}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {n.link ? <Link href={n.link} className="underline underline-offset-2">{n.cuerpo}</Link> : n.cuerpo}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(n.created_at).toLocaleString("es-PE")}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void toggleLeida(n.id)}>
                  {n.leida ? "Marcar no leída" : "Marcar leída"}
                </Button>
              </div>
            ))
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-600">No hay notificaciones.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
