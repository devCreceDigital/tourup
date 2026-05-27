import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/shared/ui/AppShell";

export function LoginScreen() {
  return (
    <AppShell>
      <section className="auth-panel">
        <ShieldCheck size={32} />
        <h1>Acceso Totem HUB</h1>
        <form>
          <label>Email<input name="email" type="email" /></label>
          <label>Password<input name="password" type="password" /></label>
          <button type="submit">Ingresar</button>
        </form>
      </section>
    </AppShell>
  );
}
