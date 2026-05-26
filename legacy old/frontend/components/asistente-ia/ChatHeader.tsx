"use client"

type Language = "es" | "en" | "pt"

interface ChatHeaderProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

export default function ChatHeader({ language, onLanguageChange }: ChatHeaderProps) {
  return (
    <header className="bg-darknavy text-white px-4 py-3 rounded-cardlg shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-sm sm:text-base">🧭 Asistente IA&nbsp;&nbsp;by ToTem HUB</div>
        <div className="flex items-center gap-1">
          {(["es", "en"] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              className={`px-2 py-1 text-xs rounded-btn border transition ${
                language === lang
                  ? "bg-white text-darknavy border-white"
                  : "bg-transparent text-white border-white/40 hover:bg-white/10"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
