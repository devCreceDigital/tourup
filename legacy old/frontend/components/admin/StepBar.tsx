import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "done" | "active" | "pending";

export type Step = {
  label: string;
  icon?: string;
  status: StepStatus;
};

interface StepBarProps {
  steps: Step[];
}

export default function StepBar({ steps }: StepBarProps) {
  return (
    <div className="flex gap-0 mb-4">
      {steps.map((step, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === steps.length - 1;

        return (
          <div
            key={idx}
            className={cn(
              "flex-1 px-3 py-2 text-center text-[11px] border border-[#E0E4EF]",
              !isLast && "border-r-0",
              isFirst && "rounded-l-[8px]",
              isLast && "rounded-r-[8px]",
              step.status === "active" && "bg-[#ECE6FB] border-[#5B5BDB] text-[#5B5BDB] font-bold",
              step.status === "done" && "bg-[#E3F9EC] border-[#1A8A4A] text-[#1A8A4A] font-semibold",
              step.status === "pending" && "bg-[#F5F6FB] text-[#888]"
            )}
          >
            <span className="inline-flex items-center gap-1">
              {step.status === "done" ? <Check className="h-3 w-3" /> : null}
              {step.icon ? <span>{step.icon}</span> : null}
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
