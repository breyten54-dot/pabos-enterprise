import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import type { Client } from '@/types'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  consent: z.boolean().refine((v) => v === true, 'Consent is required under POPIA'),
})

type FormData = z.infer<typeof schema>

export function NewClient() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation<Client, Error, FormData>({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        type: 'INDIVIDUAL',
        idType: 'RSA_ID',
        consentGranted: data.consent,
        consentPurpose: 'MARKETING',
      }
      const response = await api.post<Client>('/clients', payload)
      return response.data
    },
    onSuccess: () => {
      navigate('/clients')
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate('/clients')} className="btn-secondary flex items-center gap-2">
        <ArrowLeft size={16} />
        Back to clients
      </button>

      <div className="card">
        <h2 className="text-lg font-semibold text-gold mb-4">New Client</h2>

        {mutation.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            Failed to create client. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
              <input id="phone" {...register('phone')} />
            </div>
            <div>
              <label htmlFor="idNumber" className="block text-sm font-medium text-slate-300 mb-1">ID Number</label>
              <input id="idNumber" {...register('idNumber')} />
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input type="checkbox" id="consent" {...register('consent')} className="mt-1" />
            <label htmlFor="consent" className="text-sm text-slate-300">
              The client consents to the lawful processing of their personal information in terms of
              POPIA.
            </label>
          </div>
          {errors.consent && <p className="text-red-400 text-xs">{errors.consent.message}</p>}

          <div className="pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
              <Save size={18} />
              {mutation.isPending ? 'Saving…' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
