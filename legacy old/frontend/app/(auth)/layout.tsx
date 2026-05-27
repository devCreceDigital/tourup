/**
 * Layout para rutas de autenticacion (login, signup, recuperar password).
 *
 * Pantallas limpias sin sidebar ni topbar del dashboard.
 * Cuando el usuario esta logueado, lo redirigimos al dashboard via middleware.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
