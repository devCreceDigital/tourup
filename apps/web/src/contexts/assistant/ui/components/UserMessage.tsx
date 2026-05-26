import type { ChatMessage } from "@/shared/domain/totem-types"

interface UserMessageProps {
  message: ChatMessage
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] sm:max-w-[70%] bg-primary text-white rounded-[12px] px-3 py-2 text-sm whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  )
}
