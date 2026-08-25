import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export function ForgotPassword() {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      await api.post('/auth/forgot-password', data)
      setDone(true)
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Request failed. Please try again.'
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
        <h1 className="text-2xl font-bold text-center text-gold mb-2">Forgot password</h1>
        <p className="text-center text-slate-400 mb-6">
          If an account exists, a reset token is queued. Email send needs SMTP (not configured).
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {done ? (
          <p className="text-success text-sm text-center">
            If an account exists, a reset link was queued.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input id="forgot-email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Sending…' : 'Request reset'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400 mt-4">
          <Link to="/login" className="text-gold hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
