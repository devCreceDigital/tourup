import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-xl font-semibold">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">La página que buscas no existe o fue movida.</p>
        <Button onClick={() => setLocation("/")} data-testid="btn-404-home">
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}
