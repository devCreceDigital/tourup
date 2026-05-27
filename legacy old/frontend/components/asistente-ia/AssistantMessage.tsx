import type { ChatMessage, MatchResult } from "@/types"
import AgencyMatchCard from "./AgencyMatchCard"
import AIFollowUpCard from "./AIFollowUpCard"
import AgentPipelineIndicator from "./AgentPipelineIndicator"
import ToolResultCards from "./ToolResultCards"

interface AssistantMessageProps {
  message: ChatMessage
  isLastMessage: boolean
  onContact: (match: MatchResult) => void
  onViewDetail: (match: MatchResult) => void
  onChipClick: (text: string) => void
}

export default function AssistantMessage({
  message,
  isLastMessage,
  onContact,
  onViewDetail,
  onChipClick,
}: AssistantMessageProps) {
  // Chips solo en el último mensaje y cuando el asistente explícitamente pide elegir
  const shouldShowChips =
    isLastMessage &&
    !message.isStreaming &&
    !!message.content &&
    /(elige una opci[oó]n|elige|opciones)/i.test(message.content)

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] sm:max-w-[78%]">
        <div className="bg-white border border-border rounded-[12px] px-3 py-2 text-sm text-text whitespace-pre-wrap">
          {message.content}
          {message.isStreaming ? <span className="ml-1 inline-block animate-pulse text-accent">▋</span> : null}
        </div>

        {/* Pipeline indicator — visible while streaming */}
        {(message.pipelineSteps?.length ?? 0) > 0 ? (
          <AgentPipelineIndicator steps={message.pipelineSteps!} />
        ) : null}

        {/* Tool result cards — itinerary, budget, weather, hotels */}
        {(message.toolResults?.length ?? 0) > 0 ? (
          <ToolResultCards toolResults={message.toolResults!} />
        ) : null}

        {shouldShowChips ? (
          <AIFollowUpCard text={message.content} onChipClick={onChipClick} />
        ) : null}
        {message.matches?.length ? (
          <div className="mt-2 space-y-2">
            {message.matches.map((match) => (
              <AgencyMatchCard
                key={`${message.id}-${match.trip_id}`}
                match={match}
                onContact={onContact}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
