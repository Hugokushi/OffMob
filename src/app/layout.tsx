import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Off Mob | Gestão de Negócios',
  description: 'Plataforma SaaS multi-tenant para gestão de negócios',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}

