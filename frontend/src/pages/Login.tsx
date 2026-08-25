import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { setStoredUser, userFromToken } from '@/lib/auth'
import type { LoginResponse } from '@/types'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [mfaRequired, setMfaRequired] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      const payload = mfaRequired
        ? { email: data.email, password: data.password, totpCode: data.totpCode }
        : { email: data.email, password: data.password }
      const response = await api.post<LoginResponse>('/auth/login', payload)
      const result = response.data
      const challenge = result.mfaRequired || result.requiresMfa

      if (challenge && !result.accessToken) {
        setMfaRequired(true)
        return
      }

      if (!result.accessToken || !result.refreshToken) {
        setError('Login failed. Please try again.')
        return
      }

      localStorage.setItem('pabos_access_token', result.accessToken)
      localStorage.setItem('pabos_refresh_token', result.refreshToken)
      const user = userFromToken(result.accessToken)
      if (user) setStoredUser(user)
      navigate('/clients')
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Login failed. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="card w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
            <Shield size={28} className="text-gold" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gold mb-2">PABOS Enterprise</h1>
        <p className="text-center text-slate-400 mb-6">
          {mfaRequired ? 'MFA required — enter your authenticator code' : 'Sign in to your account'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className={mfaRequired ? 'hidden' : undefined}>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input id="login-email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className={mfaRequired ? 'hidden' : undefined}>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {mfaRequired && (
            <div>
              <p className="text-sm text-slate-400 mb-3">
                Signing in as <span className="text-slate-200">{getValues('email')}</span>
              </p>
              <label htmlFor="login-totp" className="block text-sm font-medium text-slate-300 mb-1">
                Authenticator code
              </label>
              <input
                id="login-totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                {...register('totpCode')}
              />
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Signing in…' : mfaRequired ? 'Verify and sign in' : 'Sign in'}
          </button>
        </form>

        {!mfaRequired && (
          <p className="text-center text-sm text-slate-400 mt-4">
            <Link to="/forgot-password" className="text-gold hover:underline">
              Forgot password
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
