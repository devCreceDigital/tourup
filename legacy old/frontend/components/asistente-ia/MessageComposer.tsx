"use client"

import { useState } from "react"

interface MessageComposerProps {
  onSend: (content: string) => Promise<boolean>
  isStreaming: boolean
  disabled?: boolean
  isFirstMessage?: boolean
}

const STARTER_CHIPS = [
  "Quiero un viaje en pareja, algo romántico",
  "Busco un viaje familiar con niños",
  "No sé a dónde ir, sorpréndeme",
  "Quiero aventura y naturaleza",
  "Tengo presupuesto ajustado, ¿qué opciones hay?",
]

export default function MessageComposer({ onSend, isStreaming, disabled, isFirstMessage }: MessageComposerProps) {
  const [value, setValue] = useState("")

  const submit = async (content?: string) => {
    const text = (content ?? value).trim()
    if (!text || isStreaming || disabled) return
    const ok = await onSend(text)
    if (ok) setValue("")
  }

  return (
    <div className="rounded-card border border-border bg-white p-3">
      {isFirstMessage ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {STARTER_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void submit(chip)}
              className="text-xs px-2 py-1 rounded-badge border border-border hover:bg-bgtablehover text-left"
              disabled={isStreaming || disabled}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 1000))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void submit()
          }
        }}
        placeholder="Cuéntame qué viaje estás buscando..."
        className="w-full h-24 resize-none rounded-btn border border-borderinput px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        disabled={isStreaming || disabled}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-textmuted">{value.length}/1000</span>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!value.trim() || isStreaming || disabled}
          className="text-sm px-3 py-1.5 rounded-btn bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
