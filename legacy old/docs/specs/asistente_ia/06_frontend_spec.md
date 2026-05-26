# Spec 06 — Frontend: Chat Discovery

> SSD: Define la única pantalla del viajero. Implementar en Next.js App Router.
> Design system: tokens de CONTEXT.md §8. Sin valores hardcodeados.

---

## Ruta pública

```
/asistente-ia  →  app/asistente-ia/page.tsx
Sin autenticación requerida. Excluir de middleware.ts:
```
```typescript
// middleware.ts — agregar a rutas públicas
const PUBLIC_PATHS = ["/asistente-ia"]
```

---

## Árbol de componentes

```
app/asistente-ia/page.tsx          (Server Component — solo shell)
└── ChatDiscovery.tsx              (Client Component — "use client")
    ├── ChatHeader.tsx             logo + selector idioma ES|EN
    ├── ChatThread.tsx             lista mensajes + auto-scroll
    │   ├── UserMessage.tsx
    │   ├── AssistantMessage.tsx
    │   ├── AgencyMatchCard.tsx    resultado RAG
    │   └── AIFollowUpCard.tsx     pregunta de clarificación con chips
    ├── MessageComposer.tsx        input + chips de atajo + botón enviar
    └── LeadForm.tsx               drawer: nombre + email + mensaje
```

---

## Contratos de props

### `ChatMessage` (tipo compartido)
```typescript
type ChatMessage = {
  id:           string
  role:         "user" | "assistant"
  content:      string
  matches?:     MatchResult[]
  clarification?: string
  isStreaming?:  boolean
}
```

### `AgencyMatchCardProps`
```typescript
interface AgencyMatchCardProps {
  match:        MatchResult
  onContact:    (match: MatchResult) => void
  onViewDetail: (match: MatchResult) => void
}
```

### `LeadFormProps`
```typescript
interface LeadFormProps {
  isOpen:       boolean
  onClose:      () => void
  match:        MatchResult
  sessionToken: string
  onSuccess:    (leadId: string) => void
}

interface LeadFormData {
  traveler_name:  string  // requerido, min 2 chars
  traveler_email: string  // requerido, formato email
  traveler_msg:   string  // opcional, max 500 chars
}
```

---

## Hook `useChatSession`

```typescript
// frontend/hooks/useChatSession.ts
function useChatSession() {
  return {
    sessionId:    string | null,
    sessionToken: string | null,
    messages:     ChatMessage[],
    isStreaming:  boolean,
    error:        string | null,
    initSession:  () => Promise<void>,
    sendMessage:  (content: string) => void,  // dispara SSE
    submitLead:   (data: LeadFormData, match: MatchResult) => Promise<string>,
  }
}
```

**Flujo SSE en `sendMessage`:**
```typescript
// Usar fetch manual con ReadableStream (EventSource no soporta POST)
const response = await fetch(`/api/asistente-ia/sessions/${sessionId}/message/`, {
  method: "POST",
  body: JSON.stringify({ session_token, content }),
})
const reader = response.body!.getReader()

// Procesar líneas "data: {...}"
// "token"         → append content al último mensaje
// "matches"       → asignar matches[] al último mensaje
// "clarification" → asignar clarification al último mensaje
// "done"          → isStreaming = false
```

---

## Tokens de diseño aplicados

| Elemento | Token | Valor |
|----------|-------|-------|
| Fondo pantalla | `--color-bg` | `#F4F5F7` |
| Header | `--color-dark-navy` | `#1E1B4B` |
| Burbuja usuario | `--color-primary` | `#5B4FE8` + texto blanco |
| Burbuja asistente | `--color-bg-card` | `#FFFFFF` + borde `#E0E4EF` |
| CTA "Contactar" | `--color-primary` | `#5B4FE8` |
| Match ≥ 90% | `--color-success` | `#1A8A4A` |
| Match 70-89% | `--color-warning` | `#F59E0B` |
| Card border-radius | — | `8px` |

---

## Chips de atajo

```typescript
const QUICK_CHIPS = ["Aventura", "Familia con niños", "Sin vuelos", "Presupuesto medio"]
// Click → inserta texto en el input de MessageComposer
```

---

## AgencyMatchCard — layout visual

```
┌─────────────────────────────────────────────┐
│  🏆 94%  [Nombre Agencia]                   │
│  ⭐ [rating] · [N] reseñas                  │
│                                             │
│  [Nombre itinerario] — [N]D                 │
│  📅 Próxima salida: [fecha]                 │
│  💺 [N] plazas · 💰 Desde [precio]          │
│                                             │
│  [Ver itinerario]      [Contactar →]        │
└─────────────────────────────────────────────┘
```

`[Contactar →]` abre `LeadForm` como drawer lateral.

---

## Criterios de aceptación

- [ ] Primer token del stream visible en < 3 segundos
- [ ] Scroll automático al último mensaje durante el stream
- [ ] `AgencyMatchCard` renderiza con datos reales del RAG
- [ ] `LeadForm` valida email antes de submit (client-side)
- [ ] Mensaje de éxito visible tras submit del lead
- [ ] Responsive: funciona en 320px (móvil) y 1280px (desktop)
- [ ] Sin errores TypeScript: `pnpm tsc --noEmit` pasa limpio
