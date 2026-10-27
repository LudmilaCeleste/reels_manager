import { clsx, type ClassValue } from 'clsx'

/** Une clases de Tailwind ignorando las que sean falsas. */
export function cn(...clases: ClassValue[]): string {
  return clsx(clases)
}
