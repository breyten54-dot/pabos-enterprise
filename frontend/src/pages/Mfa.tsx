import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import type { MfaResponse } from '@/types'

const schema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
})

type FormData = z.infer<typeof schema>

export function Mfa() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const tempToken = localStorage.getItem('pabos_temp_token')
    if (!tempToken) {
      navigate('/login')
      return
    }

    try {
      const response = await api.post<MfaResponse>('/auth/mfa/verify', data, {
        headers: { Authorization: `Bearer ${tempToken}` },
      })
      const result = response.data
      localStorage.setItem('pabos_access_token', result.accessToken)
      localStorage.setItem('pabos_refresh_token', result.refreshToken)
      localStorage.removeItem('pabos_temp_token')
      navigate('/clients')
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'MFA verification failed. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="card w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
            <KeyRound size={28} className="text-gold" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gold mb-2">Two-Factor Authentication</h1>
        <p className="text-center text-slate-400 mb-6">
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">TOTP Code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              {...register('code')}
            />
            {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  )
}
