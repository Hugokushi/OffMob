'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Building2, 
  User, 
  Users, 
  Lock, 
  Mail, 
  ArrowRight, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ChevronLeft, 
  Building,
  KeyRound
} from 'lucide-react'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  
  const [activeTab, setActiveTab] = useState<'owner' | 'colab' | 'register'>((searchParams.get('tab') as any) || 'owner')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(errorParam ? 'Ocorreu um erro na autenticação.' : '')

  // Owner Login State
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  // Colab Login State
  const [colabLogin, setColabLogin] = useState('')
  const [colabPassword, setColabPassword] = useState('')

  // Register Wizard State
  const [registerStep, setRegisterStep] = useState(1)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regCompanyName, setRegCompanyName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regCnpj, setRegCnpj] = useState('')
  const [regPlan, setRegPlan] = useState<'FREE' | 'SECUNDARIO' | 'PRO' | 'FULL'>('FREE')

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const res = await signIn('owner-login', {
        email: ownerEmail,
        password: ownerPassword,
        redirect: false,
      })

      if (res?.error) {
        setErrorMsg('Email ou senha incorretos.')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setErrorMsg('Erro inesperado ao fazer login.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleColabLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const res = await signIn('colaborador-login', {
        login: colabLogin,
        password: colabPassword,
        redirect: false,
      })

      if (res?.error) {
        setErrorMsg('Usuário ou senha incorretos.')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setErrorMsg('Erro inesperado ao fazer login.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: regName,
          email: regEmail,
          senha: regPassword,
          empresaNome: regCompanyName,
          telefone: regPhone,
          cnpj: regCnpj,
          plano: regPlan,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar conta.')
      }

      // Auto login after register
      const res = await signIn('owner-login', {
        email: regEmail,
        password: regPassword,
        redirect: false,
      })

      if (res?.error) {
        setErrorMsg('Conta criada, mas falha no login automático.')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro inesperado ao criar conta.')
    } finally {
      setIsLoading(false)
    }
  }

  const plans = [
    { id: 'FREE', name: 'Grátis', price: 'R$ 0/mês', desc: 'Recursos básicos para começar', users: 2 },
    { id: 'SECUNDARIO', name: 'Secundário', price: 'R$ 30/mês', desc: 'Mais recursos para sua equipe', users: 5 },
    { id: 'PRO', name: 'Pro', price: 'R$ 50/mês', desc: 'Ideal para empresas em crescimento', users: 20 },
    { id: 'FULL', name: 'Full', price: 'R$ 100/mês', desc: 'Acesso completo a todas as ferramentas', users: 100 },
  ] as const

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Building className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Off Mob
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Gestão inteligente para sua empresa
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-card text-card-foreground py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Tabs */}
          <div className="flex justify-between border-b border-border mb-6">
            <button
              onClick={() => { setActiveTab('owner'); setErrorMsg(''); }}
              className={`pb-3 text-sm font-medium flex-1 text-center border-b-2 transition-colors ${
                activeTab === 'owner' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="inline-block w-4 h-4 mr-2" />
              Dono
            </button>
            <button
              onClick={() => { setActiveTab('colab'); setErrorMsg(''); }}
              className={`pb-3 text-sm font-medium flex-1 text-center border-b-2 transition-colors ${
                activeTab === 'colab' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Colaborador
            </button>
            <button
              onClick={() => { setActiveTab('register'); setErrorMsg(''); setRegisterStep(1); }}
              className={`pb-3 text-sm font-medium flex-1 text-center border-b-2 transition-colors ${
                activeTab === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="inline-block w-4 h-4 mr-2" />
              Nova Empresa
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              </div>
            </div>
          )}

          {/* Owner Login Form */}
          {activeTab === 'owner' && (
            <form onSubmit={handleOwnerLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Entrando...' : 'Entrar na Conta'}
              </button>
            </form>
          )}

          {/* Colab Login Form */}
          {activeTab === 'colab' && (
            <form onSubmit={handleColabLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground">Usuário de Acesso</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={colabLogin}
                    onChange={(e) => setColabLogin(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border"
                    placeholder="Seu usuário"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={colabPassword}
                    onChange={(e) => setColabPassword(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </form>
          )}

          {/* Register Wizard */}
          {activeTab === 'register' && (
            <form onSubmit={registerStep === 3 ? handleRegister : (e) => { e.preventDefault(); setRegisterStep(s => s + 1); }} className="space-y-6">
              {registerStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-medium text-foreground mb-4 border-b pb-2">Dados do Administrador</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground">Nome Completo</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border" placeholder="Seu nome" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">Email</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border" placeholder="seu@email.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">Senha</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border" placeholder="Mínimo 6 caracteres" minLength={6} />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Próximo Passo <ArrowRight className="ml-2 w-4 h-4 inline-block" />
                  </button>
                </div>
              )}

              {registerStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center mb-4 border-b pb-2">
                    <button type="button" onClick={() => setRegisterStep(1)} className="mr-2 text-gray-400 hover:text-muted-foreground">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-medium text-foreground">Dados da Empresa</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground">Nome da Empresa</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="text" required value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border" placeholder="Nome Fantasia / Razão Social" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">Telefone (Opcional)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border" placeholder="(00) 00000-0000" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">CNPJ (Opcional)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="text" value={regCnpj} onChange={(e) => setRegCnpj(e.target.value)} className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-border rounded-md py-2 border" placeholder="00.000.000/0000-00" />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Escolher Plano <ArrowRight className="ml-2 w-4 h-4 inline-block" />
                  </button>
                </div>
              )}

              {registerStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center mb-4 border-b pb-2">
                    <button type="button" onClick={() => setRegisterStep(2)} className="mr-2 text-gray-400 hover:text-muted-foreground">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-medium text-foreground">Escolha seu Plano</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {plans.map((p) => (
                      <label key={p.id} className={`relative block rounded-lg border p-4 cursor-pointer hover:border-blue-500 transition-colors ${regPlan === p.id ? 'border-blue-500 bg-blue-50/50' : 'border-border bg-card text-card-foreground'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input type="radio" name="plan" value={p.id} checked={regPlan === p.id} onChange={() => setRegPlan(p.id)} className="h-4 w-4 text-blue-600 border-border focus:ring-blue-500" />
                            <div className="ml-3">
                              <span className="block text-sm font-medium text-foreground">{p.name}</span>
                              <span className="block text-sm text-muted-foreground">{p.desc} ({p.users} usuários)</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-foreground">{p.price}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                    {isLoading ? 'Criando Conta...' : 'Finalizar e Acessar'}
                    {!isLoading && <CheckCircle2 className="ml-2 w-5 h-5 inline-block" />}
                  </button>
                </div>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <AuthContent />
    </Suspense>
  )
}
