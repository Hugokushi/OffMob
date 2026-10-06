'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface UpgradeButtonProps {
  empresaId: string
  plano?: string
  className?: string
  text?: string
}

export default function UpgradeButton({
  empresaId,
  plano,
  className,
  text = 'Fazer Upgrade / Assinar Agora',
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId, plano }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao gerar checkout.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao acessar Stripe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={
        className ||
        'inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50'
      }
    >
      <Sparkles className="w-4 h-4 text-amber-300" />
      {loading ? 'Redirecionando...' : text}
    </button>
  )
}
