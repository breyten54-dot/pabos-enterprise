import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KeyRound, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

const schema = z.object({
  password: z.string().min(10, 'Password must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

export function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    if (!token) {
      setError('Reset token is missing.')
      return
    }
    try {
      await api.post('/auth/reset-password', { token, password: data.password })
      setDone(true)
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Reset failed. The token may be invalid or expired.'
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
        <h1 className="text-2xl font-bold text-center text-gold mb-2">Set a new password</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {done ? (
          <p className="text-success text-sm text-center">
            Password updated.{' '}
            <Link to="/login" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="reset-password" className="block text-sm font-medium text-slate-300 mb-1">
                New password
              </label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
