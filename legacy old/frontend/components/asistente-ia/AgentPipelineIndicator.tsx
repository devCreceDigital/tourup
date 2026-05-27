import type { PipelineStep } from "@/types"
import { CheckCircle2, Circle, Loader2, Wrench } from "lucide-react"

interface AgentPipelineIndicatorProps {
  steps: PipelineStep[]
}

export default function AgentPipelineIndicator({ steps }: AgentPipelineIndicatorProps) {
  if (!steps.length) return null

  const doneCount = steps.filter((s) => s.status === "done").length
  const totalCount = steps.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="mt-2 rounded-[10px] border border-border bg-[#FAFBFF] px-3 py-2.5 space-y-2">
      {/* Progress bar */}
      <div className="w-full h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps list */}
      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 min-h-[18px]">
            <StepIcon step={step} />
            <span
              className={[
                "text-xs leading-none flex-1 truncate",
                step.status === "done"    ? "text-[#9CA3AF]" : "",
                step.status === "running" ? "text-[#1A1A2E] font-medium" : "",
                step.status === "pending" ? "text-[#D1D5DB]" : "",
              ].join(" ")}
            >
              {step.label}
            </span>
            {step.summary && step.status === "done" ? (
              <span className="text-[10px] text-[#9CA3AF] shrink-0 ml-1">{step.summary}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StepIcon({ step }: { step: PipelineStep }) {
  if (step.status === "done") {
    return <CheckCircle2 size={13} className="text-[#1A8A4A] shrink-0" />
  }
  if (step.status === "running") {
    return step.type === "tool"
      ? <Wrench size={13} className="text-[#5B4FE8] shrink-0 animate-pulse" />
      : <Loader2 size={13} className="text-[#5B4FE8] shrink-0 animate-spin" />
  }
  return <Circle size={13} className="text-[#E0E4EF] shrink-0" />
}
