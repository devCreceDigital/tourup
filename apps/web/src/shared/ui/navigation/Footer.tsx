import Link from "next/link";
import { Plane, MapPin, Phone, Mail } from "lucide-react";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Destinos", href: "/destinos" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contacto", href: "/contacto" },
  { label: "Iniciar sesión", href: "/login" },
  { label: "Registrarse", href: "/registro" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1E1E4E] dark:bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Marca */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tighter">
              <Plane className="h-7 w-7 text-white" />
              <span className="text-[#00B4FC]">totem</span><span className="text-white">hub</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-300">
              Somos especialistas en viajes grupales, escolares y corporativos. Digitalizamos toda la logística para que tu grupo solo se preocupe de disfrutar.
            </p>
            <div className="mt-6 flex gap-4">
              <SocialIcon aria-label="Instagram">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </SocialIcon>
              <SocialIcon aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </SocialIcon>
              <SocialIcon aria-label="WhatsApp">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#00B4FC]">
              Navegación
            </h3>
            <ul className="space-y-3 text-sm">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-indigo-300 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#00B4FC]">
              Contacto
            </h3>
            <ul className="space-y-4 text-sm text-indigo-300">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00B4FC]" />
                Lima, Perú
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#00B4FC]" />
                +51 900 000 000
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#00B4FC]" />
                hola@totem.pe
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-indigo-400 sm:flex-row sm:px-8 lg:px-16">
          <span>© {new Date().getFullYear()} Totem HUB. Todos los derechos reservados.</span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Términos y condiciones</Link>
            <Link href="#" className="hover:text-white transition-colors">Política de privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ children, "aria-label": label }: { children: React.ReactNode; "aria-label": string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-[#00B4FC] hover:text-[#00B4FC]"
    >
      {children}
    </a>
  );
}
