import { cn } from '../lib/cn'

/** Monograma "AC" de la marca (el mismo de la app de escritorio). */
export function Logo({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-300 via-brand-500 to-brand-700 text-[17px] font-extrabold tracking-tight text-white shadow-[0_10px_24px_-10px_rgb(20_146_138/0.9)]',
        className,
      )}
    >
      <span className="absolute -left-3 -top-5 size-10 rotate-12 rounded-full bg-white/25 blur-md" />
      <span className="relative">AC</span>
    </div>
  )
}
