import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'owner-login',
      name: 'Dono da Empresa',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.usuario.findUnique({
          where: { email },
        })

        if (!user || !user.senhaHash) return null

        const isValid = await bcrypt.compare(password, user.senhaHash)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          image: user.avatarUrl,
        }
      },
    }),
    Credentials({
      id: 'colaborador-login',
      name: 'Colaborador',
      credentials: {
        login: { label: 'Login', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null

        const login = credentials.login as string
        const password = credentials.password as string

        const user = await prisma.usuario.findUnique({
          where: { login },
        })

        if (!user || !user.senhaHash) return null

        const isValid = await bcrypt.compare(password, user.senhaHash)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          image: user.avatarUrl,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
