"use client"

import { useEffect, useRef } from "react"
import type { ChatMessage, MatchResult } from "@/types"
import UserMessage from "./UserMessage"
import AssistantMessage from "./AssistantMessage"

interface ChatThreadProps {
  messages: ChatMessage[]
  onContact: (match: MatchResult) => void
  onViewDetail: (match: MatchResult) => void
  onChipClick: (text: string) => void
}

export default function ChatThread({ messages, onContact, onViewDetail, onChipClick }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  // Solo el último mensaje del asistente puede mostrar chips
  const lastAssistantIndex = messages.reduce(
    (last, msg, i) => (msg.role === "assistant" ? i : last),
    -1
  )

  return (
    <section className="flex-1 overflow-y-auto rounded-card border border-border bg-bgcard p-3">
      <div className="space-y-3">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              isLastMessage={index === lastAssistantIndex}
              onContact={onContact}
              onViewDetail={onViewDetail}
              onChipClick={onChipClick}
            />
          )
        )}
      </div>
      <div ref={endRef} />
    </section>
  )
}
