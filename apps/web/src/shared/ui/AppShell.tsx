import Link from "next/link";

const navigation = [
  { href: "/", label: "Hub" },
  { href: "/admin", label: "Admin" },
  { href: "/viajero", label: "Viajero" },
  { href: "/superadmin", label: "Superadmin" },
  { href: "/asistente-ia", label: "Asistente" }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="app-shell">
      <nav className="topbar">
        <Link href="/" className="brand">Totem HUB</Link>
        <div className="navlinks">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </div>
      </nav>
      {children}
    </main>
  );
}
