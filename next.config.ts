import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Permite imagens de qualquer domínio (para logos externas se necessário)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Permite data URLs (base64) para logos carregadas localmente
    dangerouslyAllowSVG: true,
  },
  // Garante que o Prisma seja incluído corretamente no bundle serverless do Vercel
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
}

export default nextConfig
