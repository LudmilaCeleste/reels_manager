import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Une clases de Tailwind ignorando las que sean falsas. Si dos clases se pisan
 * (por ejemplo `inline-flex` y `hidden`), gana la última, no la que el CSS ponga después.
 */
export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases))
}
