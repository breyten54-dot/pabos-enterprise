import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { Client, Policy } from '@/types'

const schema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  lineOfBusiness: z.enum(['MOTOR', 'HOME', 'COMMERCIAL', 'LIFE', 'MEDICAL_AID', 'EMPLOYEE_BENEFITS', 'LIABILITY', 'TRANSPORT', 'AGRICULTURE', 'SPECIALIST']),
  inceptionDate: z.string().min(1, 'Inception date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  premium: z.coerce.number().positive('Premium must be greater than 0'),
  sumInsured: z.coerce.number().positive('Sum insured must be greater than 0'),
  riskAddressLine1: z.string().min(1, 'Risk address is required'),
  riskCity: z.string().min(1, 'City is required'),
  riskProvince: z.string().min(1, 'Province is required'),
  riskPostalCode: z.string().min(1, 'Postal code is required'),
})

type FormData = z.infer<typeof schema>

export function NewPolicy() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lineOfBusiness: 'MOTOR',
    },
  })

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get<Client[]>('/clients')
      return response.data
    },
  })

  const mutation = useMutation<Policy, Error, FormData>({
    mutationFn: async (data) => {
      const response = await api.post<Policy>('/policies', {
        ...data,
        premium: String(data.premium),
        sumInsured: String(data.sumInsured),
      })
      return response.data
    },
    onSuccess: () => {
      navigate('/policies')
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate('/policies')} className="btn-secondary flex items-center gap-2">
        <ArrowLeft size={16} />
        Back to policies
      </button>

      <div className="card">
        <h2 className="text-lg font-semibold text-gold mb-4">New Policy</h2>

        {mutation.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            Failed to create policy. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Client</label>
            <select {...register('clientId')} disabled={clientsLoading}>
              <option value="">{clientsLoading ? 'Loading clients…' : 'Select a client'}</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-red-400 text-xs mt-1">{errors.clientId.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Policy Number</label>
              <input {...register('policyNumber')} placeholder="e.g. POL-0001" />
              {errors.policyNumber && <p className="text-red-400 text-xs mt-1">{errors.policyNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Line of Business</label>
              <select {...register('lineOfBusiness')}>
                <option value="MOTOR">Motor</option>
                <option value="HOME">Home</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="LIFE">Life</option>
                <option value="MEDICAL_AID">Medical Aid</option>
                <option value="EMPLOYEE_BENEFITS">Employee Benefits</option>
                <option value="LIABILITY">Liability</option>
                <option value="TRANSPORT">Transport</option>
                <option value="AGRICULTURE">Agriculture</option>
                <option value="SPECIALIST">Specialist</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Inception Date</label>
              <input type="date" {...register('inceptionDate')} />
              {errors.inceptionDate && <p className="text-red-400 text-xs mt-1">{errors.inceptionDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Expiry Date</label>
              <input type="date" {...register('expiryDate')} />
              {errors.expiryDate && <p className="text-red-400 text-xs mt-1">{errors.expiryDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Sum Insured (R)</label>
              <input type="number" step="0.01" {...register('sumInsured')} />
              {errors.sumInsured && <p className="text-red-400 text-xs mt-1">{errors.sumInsured.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Premium (R)</label>
              <input type="number" step="0.01" {...register('premium')} />
              {errors.premium && <p className="text-red-400 text-xs mt-1">{errors.premium.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Risk Address Line 1</label>
            <input {...register('riskAddressLine1')} />
            {errors.riskAddressLine1 && <p className="text-red-400 text-xs mt-1">{errors.riskAddressLine1.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
              <input {...register('riskCity')} />
              {errors.riskCity && <p className="text-red-400 text-xs mt-1">{errors.riskCity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Province</label>
              <input {...register('riskProvince')} />
              {errors.riskProvince && <p className="text-red-400 text-xs mt-1">{errors.riskProvince.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Postal Code</label>
              <input {...register('riskPostalCode')} />
              {errors.riskPostalCode && <p className="text-red-400 text-xs mt-1">{errors.riskPostalCode.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending || clientsLoading}
              className="btn-primary flex items-center gap-2"
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {mutation.isPending ? 'Saving…' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
