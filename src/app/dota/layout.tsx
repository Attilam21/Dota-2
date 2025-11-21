import type { ReactNode } from 'react'

/**
 * Layout per le pagine Dota 2 analysis
 * Usa il layout dashboard esistente per coerenza visiva
 */
export default function DotaLayout({ children }: { children: ReactNode }) {
  // Questo layout è minimale e delega al root layout
  // Se in futuro serve un layout specifico per /dota, può essere esteso qui
  return <>{children}</>
}
