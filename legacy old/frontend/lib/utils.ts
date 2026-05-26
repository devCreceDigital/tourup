import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases condicionalmente y resuelve conflictos de Tailwind.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * cn("bg-red-500", "bg-blue-500") // → "bg-blue-500" (gana el último)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}