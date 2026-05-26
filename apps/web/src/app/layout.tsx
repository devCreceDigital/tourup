import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth/AuthContext";

export const metadata: Metadata = {
  title: "Totem HUB",
  description: "Totem HUB microservices DDD modernization"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
