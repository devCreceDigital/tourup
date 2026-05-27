/** Skeleton placeholders shown in the workspace while Hermes pipeline runs. */

function Bone({ w = "100%", h = 12, rounded = 6 }: { w?: string | number; h?: number; rounded?: number }) {
  return (
    <div
      className="animate-pulse bg-[#EAECF0]"
      style={{
        width: w,
        height: h,
        borderRadius: rounded,
        flexShrink: 0,
      }}
    />
  )
}

// ── Itinerary skeleton ────────────────────────────────────────────

const DAY_WIDTHS = ["72%", "85%", "60%", "78%", "68%"]

export function ItinerarySkeleton({ days = 5 }: { days?: number }) {
  return (
    <div className="rounded-[10px] border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] border-b border-border">
        <Bone w={14} h={14} rounded={4} />
        <Bone w={120} h={11} rounded={4} />
        <div className="ml-auto">
          <Bone w={36} h={10} rounded={4} />
        </div>
      </div>

      {/* Day rows */}
      <ul className="divide-y divide-[#F9FAFB]">
        {Array.from({ length: Math.min(days, DAY_WIDTHS.length) }).map((_, i) => (
          <li key={i} className="flex items-start gap-2.5 px-3 py-2.5">
            {/* Icon + label */}
            <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
              <Bone w={20} h={20} rounded={10} />
              <Bone w={28} h={8} rounded={3} />
            </div>
            {/* Activity line */}
            <div className="flex-1 space-y-1.5 pt-1">
              <Bone w={DAY_WIDTHS[i] ?? "70%"} h={11} rounded={4} />
              <Bone w="40%" h={9} rounded={3} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Budget skeleton ───────────────────────────────────────────────

const BAR_WIDTHS = ["78%", "52%", "34%", "18%"]
const BAR_COLORS = ["#C7D2FE", "#A5F3FC", "#FDE68A", "#E5E7EB"]

export function BudgetSkeleton() {
  return (
    <div className="rounded-[10px] border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] border-b border-border">
        <Bone w={14} h={14} rounded={4} />
        <Bone w={130} h={11} rounded={4} />
        <div className="ml-auto">
          <Bone w={52} h={18} rounded={999} />
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-3">
        {/* Totals row */}
        <div className="flex items-end justify-between">
          <div className="space-y-1.5">
            <Bone w={110} h={22} rounded={5} />
            <Bone w={60} h={10} rounded={3} />
          </div>
          <div className="space-y-1.5 items-end flex flex-col">
            <Bone w={80} h={16} rounded={5} />
            <Bone w={50} h={10} rounded={3} />
          </div>
        </div>

        {/* Bars */}
        <ul className="space-y-2.5">
          {BAR_WIDTHS.map((w, i) => (
            <li key={i} className="space-y-1">
              <div className="flex justify-between">
                <Bone w={70} h={10} rounded={3} />
                <Bone w={80} h={10} rounded={3} />
              </div>
              <div className="w-full h-1.5 bg-[#F4F5F7] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full animate-pulse"
                  style={{ width: w, backgroundColor: BAR_COLORS[i] }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Weather skeleton ──────────────────────────────────────────────

export function WeatherSkeleton() {
  return (
    <div className="rounded-[10px] border border-border bg-white">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Bone w={36} h={36} rounded={18} />
        <div className="space-y-1.5 flex-1">
          <Bone w={80} h={14} rounded={4} />
          <Bone w={60} h={10} rounded={3} />
        </div>
        <div className="w-px h-8 bg-border shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Bone w={60} h={10} rounded={3} />
          <Bone w={90} h={12} rounded={4} />
        </div>
      </div>
    </div>
  )
}
