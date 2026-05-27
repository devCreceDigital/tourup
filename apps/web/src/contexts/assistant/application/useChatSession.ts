"use client"

import { useCallback, useState } from "react"
import type { BudgetResult, ChatMessage, HotelsResult, ItineraryDay, LeadFormData, MapMarker, MatchResult, PipelineStep, WeatherResult } from "@/shared/domain/totem-types"
import { fetchAssistant } from "@/shared/api/assistant-api-client"

interface ChatSessionState {
  sessionId: string | null
  sessionToken: string | null
  messages: ChatMessage[]
  language: "es" | "en" | "pt"
  isStreaming: boolean
  error: string | null
  mapMarkers: MapMarker[]
  mapCenter: { lat: number; lng: number } | null
}

type JsonObject = Record<string, unknown>
type AssistantToolResult = ItineraryDay[] | BudgetResult | WeatherResult | HotelsResult | JsonObject

async function readResponsePayload(response: Response): Promise<{ json: JsonObject | null; text: string }> {
  const text = await response.text()
  if (!text) return { json: null, text: "" }
  try {
    return { json: JSON.parse(text), text }
  } catch {
    return { json: null, text }
  }
}

const INITIAL_STATE: ChatSessionState = {
  sessionId: null,
  sessionToken: null,
  messages: [],
  language: "es",
  isStreaming: false,
  error: null,
  mapMarkers: [],
  mapCenter: null,
}

function normalizeToolResult(result: unknown): AssistantToolResult {
  if (Array.isArray(result)) {
    return result.filter((entry): entry is ItineraryDay => typeof entry === "object" && entry !== null) as ItineraryDay[]
  }
  if (typeof result === "object" && result !== null) {
    return result as JsonObject
  }
  return { value: result ?? null }
}

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string | null>(INITIAL_STATE.sessionId)
  const [sessionToken, setSessionToken] = useState<string | null>(INITIAL_STATE.sessionToken)
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_STATE.messages)
  const [language, setLanguage] = useState<"es" | "en" | "pt">(INITIAL_STATE.language)
  const [isStreaming, setIsStreaming] = useState(INITIAL_STATE.isStreaming)
  const [error, setError] = useState<string | null>(INITIAL_STATE.error)

  // Crea una sesión anónima en el backend y guarda sessionId + sessionToken
  const initSession = useCallback(async (): Promise<void> => {
    if (sessionId && sessionToken) return
    setError(null)
    try {
      const userName = typeof window === "undefined" ? "" : localStorage.getItem("totem_nombre") ?? ""

      const response = await fetchAssistant("/sessions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, user_name: userName }),
      })
      const payload = await readResponsePayload(response)
      const data = payload.json
      if (!response.ok) {
        if (data?.detail) {
          throw new Error(data.detail as string)
        }
        if (payload.text.trim().startsWith("<")) {
          throw new Error("El backend devolvió HTML en lugar de JSON. Verifica que la API esté activa y bien configurada.")
        }
        throw new Error("No se pudo iniciar la sesión")
      }
      if (!data) {
        throw new Error("La API devolvió una respuesta inválida al crear sesión")
      }
      setSessionId(data.session_id as string)
      setSessionToken(data.session_token as string)
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: (data.welcome_message as string) || "Hola, soy Asistente IA. Cuéntame tu idea de viaje...",
          ts: new Date().toISOString(),
        },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la sesión")
    }
  }, [language, sessionId, sessionToken])

  // Envía un mensaje vía SSE (POST con ReadableStream, no EventSource)
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const cleanContent = content.trim()
      if (!cleanContent || isStreaming) return false
      if (!sessionId || !sessionToken) {
        setError("No hay sesión activa del agente. Pulsa Reintentar y vuelve a enviar.")
        return false
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: cleanContent,
        ts: new Date().toISOString(),
      }
      const assistantMessageId = crypto.randomUUID()
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
        ts: new Date().toISOString(),
      }

      setError(null)
      setIsStreaming(true)
      setMessages((prev) => [...prev, userMessage, assistantMessage])

      try {
        const response = await fetchAssistant(`/sessions/${sessionId}/message/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_token: sessionToken,
            content: cleanContent,
          }),
        })
        if (!response.ok || !response.body) {
          throw new Error("No se pudo enviar el mensaje")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder("utf-8")
        let buffer = ""

        const applyAssistantUpdate = (updater: (msg: ChatMessage) => ChatMessage) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? updater(m) : m))
          )
        }

        const handleEvent = (raw: string) => {
          const line = raw.trim()
          if (!line.startsWith("data:")) return
          const payload = line.slice(5).trim()
          if (!payload) return
          
          let event: {
            type?: string
            content?: string
            question?: string
            message?: string
            data?: unknown
            // pipeline_progress
            step?: number
            total?: number
            agent?: string
            label?: string
            // tool_start / tool_done
            tool_name?: string
            summary?: string
          }
          try {
            event = JSON.parse(payload)
          } catch {
            console.warn("Payload JSON inválido en SSE:", payload)
            return
          }

          // ── Pipeline progress events ────────────────────────────────
          if (event.type === "pipeline_progress") {
            const { agent = "", label = "" } = event
            applyAssistantUpdate((msg) => {
              // Mark any currently-running agent step as done
              const prev = (msg.pipelineSteps ?? []).map((s) =>
                s.status === "running" && s.type === "agent"
                  ? { ...s, status: "done" as const }
                  : s
              )
              // Add the new running step (avoid duplicates)
              const alreadyExists = prev.some((s) => s.id === agent)
              const next: PipelineStep[] = alreadyExists
                ? prev.map((s) => s.id === agent ? { ...s, status: "running" as const } : s)
                : [...prev, { id: agent, label, status: "running" as const, type: "agent" as const }]
              return { ...msg, pipelineSteps: next }
            })
            return
          }

          if (event.type === "tool_start") {
            const { tool_name = "", label = "" } = event
            applyAssistantUpdate((msg) => ({
              ...msg,
              pipelineSteps: [
                ...(msg.pipelineSteps ?? []),
                { id: tool_name, label, status: "running" as const, type: "tool" as const },
              ],
            }))
            return
          }

          if (event.type === "tool_done") {
            const { tool_name = "", summary = "" } = event
            applyAssistantUpdate((msg) => ({
              ...msg,
              pipelineSteps: (msg.pipelineSteps ?? []).map((s) =>
                s.id === tool_name ? { ...s, status: "done" as const, summary } : s
              ),
            }))
            return
          }

          // ── Data events ─────────────────────────────────────────────
          if (event.type === "tool_result") {
            const item = event.data as { tool_name?: string; result?: unknown } | undefined
            if (item?.tool_name) {
              applyAssistantUpdate((msg) => ({
                ...msg,
                toolResults: [
                  ...(msg.toolResults ?? []),
                  {
                    tool_name: item.tool_name!,
                    result: normalizeToolResult(item.result),
                  },
                ],
              }))
            }
            return
          }

          if (event.type === "token") {
            applyAssistantUpdate((msg) => ({ ...msg, content: `${msg.content}${event.content || ""}` }))
            return
          }
          if (event.type === "matches") {
            applyAssistantUpdate((msg) => ({ ...msg, matches: (event.data as MatchResult[]) || [] }))
            return
          }
          if (event.type === "clarification") {
            applyAssistantUpdate((msg) => ({
              ...msg,
              clarification: event.question || "",
              content: event.question || msg.content,
            }))
            return
          }
          if (event.type === "error") {
            setError(event.message || "Error interno")
            setIsStreaming(false)
            applyAssistantUpdate((msg) => ({ ...msg, isStreaming: false }))
            return
          }
          if (event.type === "done") {
            setIsStreaming(false)
            // Mark all remaining pipeline steps as done
            applyAssistantUpdate((msg) => ({
              ...msg,
              isStreaming: false,
              pipelineSteps: (msg.pipelineSteps ?? []).map((s) =>
                s.status !== "done" ? { ...s, status: "done" as const } : s
              ),
            }))
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const chunks = buffer.split("\n\n")
          buffer = chunks.pop() || ""
          for (const chunk of chunks) {
            const lines = chunk.split("\n")
            for (const line of lines) {
              handleEvent(line)
            }
          }
        }

        // Procesar cualquier dato restante en el buffer si no terminó con \n\n
        if (buffer.trim()) {
          const lines = buffer.split("\n")
          for (const line of lines) {
            handleEvent(line)
          }
        }

        // Safety net: garantiza que isStreaming siempre se resetea al cerrar el stream
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, isStreaming: false } : m))
        )
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de streaming")
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, isStreaming: false } : m))
        )
        return false
      }
    },
    [isStreaming, sessionId, sessionToken]
  )

  // Submite los datos del formulario de lead para una agencia específica
  const submitLead = useCallback(
    async (data: LeadFormData, match: MatchResult): Promise<string> => {
      if (!sessionToken) throw new Error("No hay sesión activa")
      const response = await fetchAssistant("/leads/simple/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: sessionToken,
          traveler_name: data.traveler_name,
          traveler_email: data.traveler_email,
          traveler_msg: data.traveler_msg || "",
        }),
      })
      const payload = await readResponsePayload(response)
      const result = payload.json
      if (response.status === 409) {
        throw new Error("Ya enviaste una consulta a esta agencia")
      }
      if (!response.ok) {
        if (result?.detail) {
          throw new Error(result.detail as string)
        }
        if (payload.text.trim().startsWith("<")) {
          throw new Error("La API devolvió HTML en lugar de JSON al enviar el lead")
        }
        throw new Error("No se pudo enviar el lead")
      }
      if (!result?.lead_id) {
        throw new Error("Respuesta inválida al enviar el lead")
      }
      return result.lead_id as string
    },
    [sessionToken]
  )

  return {
    sessionId,
    sessionToken,
    messages,
    language,
    setLanguage,
    isStreaming,
    error,
    initSession,
    sendMessage,
    submitLead,
  }
}
