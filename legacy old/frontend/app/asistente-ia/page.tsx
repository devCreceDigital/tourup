"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import ChatDiscovery from "@/components/asistente-ia/ChatDiscovery"

function AsistenteIAInner() {
  const params = useSearchParams()
  const cloneToken = params.get("clone")
  return <ChatDiscovery cloneToken={cloneToken} />
}

export default function AsistenteIAPage() {
  return (
    <Suspense fallback={null}>
      <AsistenteIAInner />
    </Suspense>
  )
}
