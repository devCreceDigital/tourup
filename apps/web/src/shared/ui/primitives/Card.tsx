import { cn } from "@/shared/utils/cn";
import type { HTMLAttributes, ReactNode } from "react";

/* ============================================
   <Card> — Contenedor principal
   ============================================ */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-bgcard border border-border rounded-card shadow-card overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

/* ============================================
   <CardHeader> — Cabecera con título
   PRD: padding 14px 18px, border-bottom, bold
   ============================================ */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "px-[18px] py-[14px] border-b border-border flex items-center justify-between gap-3",
        className
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-bold text-text truncate">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-textsecondary mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </>
      )}
    </div>
  );
}

/* ============================================
   <CardBody> — Contenido principal
   PRD: padding 18px
   ============================================ */
export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-[18px]", className)} {...props} />;
}

/* ============================================
   <CardFooter> — Pie con acciones
   ============================================ */
export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-[18px] py-[14px] border-t border-border bg-bgtableheader flex items-center justify-end gap-2",
        className
      )}
      {...props}
    />
  );
}