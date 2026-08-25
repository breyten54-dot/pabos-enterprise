import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Loader2, Save } from 'lucide-react'
import api from '@/lib/api'
import type { Claim, Policy } from '@/types'

const schema = z.object({
  policyId: z.string().min(1, 'Select a policy'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function NewClaim() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: policies, isLoading } = useQuery<Policy[]>({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await api.get<Policy[]>('/policies')
      return response.data
    },
  })

  const mutation = useMutation<Claim, Error, FormData>({
    mutationFn: async (data) => {
      const response = await api.post<Claim>('/claims', data)
      return response.data
    },
    onSuccess: () => navigate('/claims'),
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate('/claims')} className="btn-secondary flex items-center gap-2">
        <ArrowLeft size={16} />
        Back to claims
      </button>

      <div className="card">
        <h2 className="text-lg font-semibold text-gold mb-4">Register claim</h2>

        {mutation.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            Failed to register claim. Please try again.
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center text-gold py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Policy</label>
              <select {...register('policyId')}>
                <option value="">Select a policy</option>
                {policies?.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policyNumber}
                    {policy.client ? ` — ${policy.client.firstName} ${policy.client.lastName}` : ''}
                  </option>
                ))}
              </select>
              {errors.policyId && <p className="text-red-400 text-xs mt-1">{errors.policyId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Incident date</label>
              <input type="date" {...register('incidentDate')} />
              {errors.incidentDate && (
                <p className="text-red-400 text-xs mt-1">{errors.incidentDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea rows={4} {...register('description')} />
            </div>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
              <Save size={16} />
              {mutation.isPending ? 'Saving…' : 'Register claim'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
