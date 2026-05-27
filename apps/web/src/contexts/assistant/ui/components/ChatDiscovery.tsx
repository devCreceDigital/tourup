"use client"

import { useEffect, useState } from "react"
import { useChatSession } from "@/contexts/assistant/application/useChatSession"
import { fetchAssistantTripByToken, type AssistantTripSnapshot } from "@/contexts/assistant/application/tripShare"
import type { MatchResult } from "@/shared/domain/totem-types"
import {
  Bell,
  Heart,
  History,
  MapPin,
  MessageSquare,
  Sparkles,
  UserCircle,
  Users,
  X,
} from "lucide-react"
import ChatThread from "./ChatThread"
import MessageComposer from "./MessageComposer"
import LeadForm from "./LeadForm"
import WorkspacePanel from "./WorkspacePanel"
import styles from "./asistente-ia.module.css"

export default function ChatDiscovery({ cloneToken }: { cloneToken?: string | null }) {
  const {
    sessionToken,
    messages,
    language,
    setLanguage,
    error,
    isStreaming,
    initSession,
    sendMessage,
    submitLead,
  } = useChatSession()

  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"discovery" | "favorites" | "history">("discovery")
  const [preloadedTrip, setPreloadedTrip] = useState<AssistantTripSnapshot | null>(null)

  useEffect(() => {
    void initSession()
  }, [initSession])

  useEffect(() => {
    if (!cloneToken) return
    fetchAssistantTripByToken(cloneToken)
      .then(data => setPreloadedTrip(data))
      .catch(error => {
        console.error("Clone fetch error:", error)
      })
  }, [cloneToken])

  return (
    <div className={styles.aiShell}>
      <aside className={styles.aiSidebar} aria-label="Navegación Asistente IA">
        <div className={styles.aiSidebarLogo} aria-label="ToTem HUB">
          <span className={styles.aiLogoMark}>✦</span>
        </div>

        <nav className={styles.aiSidebarNav}>
          <button
            type="button"
            className={`${styles.aiSidebarIcon} ${styles.aiSidebarIconActive}`}
            aria-label="Chat"
          >
            <MessageSquare size={18} aria-hidden="true" />
          </button>
          <button type="button" className={styles.aiSidebarIcon} aria-label="Favoritos">
            <Heart size={18} aria-hidden="true" />
          </button>
          <button type="button" className={styles.aiSidebarIcon} aria-label="Historial">
            <History size={18} aria-hidden="true" />
          </button>
          <button type="button" className={styles.aiSidebarIcon} aria-label="Notificaciones">
            <Bell size={18} aria-hidden="true" />
          </button>
          <button type="button" className={styles.aiSidebarIcon} aria-label="Mapa">
            <MapPin size={18} aria-hidden="true" />
          </button>
        </nav>

        <div className={styles.aiSidebarBottom}>
          <button type="button" className={styles.aiSidebarIcon} aria-label="Perfil">
            <UserCircle size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <section className={styles.aiChatPanel} aria-label="Chat Asistente IA">
        <header className={styles.aiChatHeader}>
          <div className={styles.aiChatHeaderTop}>
            <Sparkles className={styles.aiSparkleIcon} size={16} aria-hidden="true" />
            <span className={styles.aiChatTitle}>Nuevo chat</span>
            <div className={styles.aiHeaderPills}>
              <span className={styles.aiPill}>
                <Users size={12} aria-hidden="true" /> 1
              </span>
              <button
                type="button"
                className={`${styles.aiPill} ${styles.aiPillLang}`}
                onClick={() => setLanguage(language === "es" ? "en" : "es")}
                aria-label="Cambiar idioma"
              >
                {language === "es" ? "ES" : "EN"}
              </button>
            </div>
          </div>

          <div className={styles.aiTabs} role="tablist" aria-label="Secciones">
            {(["discovery", "favorites", "history"] as const).map((tab) => {
              const labels = { discovery: "Descubrimiento", favorites: "Favoritos", history: "Historial" }
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.aiTab} ${active ? styles.aiTabActive : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {labels[tab]}
                </button>
              )
            })}
          </div>
        </header>

        {successMessage ? (
          <div className={`${styles.aiAlert} ${styles.aiAlertSuccess}`}>
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} aria-label="Cerrar">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {error ? (
          <div className={`${styles.aiAlert} ${styles.aiAlertError}`}>
            <span>{error}</span>
            <button type="button" onClick={() => void initSession()} className={styles.aiAlertRetry}>
              Reintentar
            </button>
          </div>
        ) : null}

        <div className={styles.aiMessagesScroll}>
          {activeTab === "discovery" ? (
            <ChatThread
              messages={messages}
              onContact={(match) => {
                setSelectedMatch(match)
                setLeadFormOpen(true)
              }}
              onViewDetail={(match) => setSelectedMatch(match)}
              onChipClick={(text) => void sendMessage(text)}
            />
          ) : (
            <div className={styles.aiEmptyState} role="status">
              <div className={styles.aiEmptyTitle}>{activeTab === "favorites" ? "Favoritos" : "Historial"}</div>
              <div className={styles.aiEmptyText}>Próximamente.</div>
            </div>
          )}
        </div>

        <div className={styles.aiComposerWrap}>
          <MessageComposer
            onSend={(content) => sendMessage(content)}
            isStreaming={isStreaming}
            isFirstMessage={messages.length <= 1}
          />
        </div>
      </section>

      <WorkspacePanel
        messages={messages}
        selectedMatch={selectedMatch}
        onCreateTrip={() => void sendMessage("Quiero crear un viaje con estas opciones")}
        sessionToken={sessionToken}
        preloadedTrip={preloadedTrip}
      />

      {leadFormOpen && selectedMatch && sessionToken ? (
        <LeadForm
          isOpen={leadFormOpen}
          onClose={() => setLeadFormOpen(false)}
          match={selectedMatch}
          sessionToken={sessionToken}
          submitLeadAction={(data) => submitLead(data, selectedMatch!)}
          onSuccess={() => {
            setLeadFormOpen(false)
            setSuccessMessage("Tu consulta fue enviada. La agencia te responderá en menos de 4 horas.")
          }}
        />
      ) : null}
    </div>
  )
}
