import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { Policy } from '@/types'

const schema = z.object({
  policyId: z.string().min(1, 'Select a policy'),
  newAddress: z.string().min(5, 'Enter the full new address'),
})

type FormData = z.infer<typeof schema>

export function AddressChange() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: policies, isLoading: policiesLoading } = useQuery<Policy[]>({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await api.get<Policy[]>('/policies')
      return response.data
    },
  })

  const mutation = useMutation<unknown, Error, FormData>({
    mutationFn: async (data) => {
      const response = await api.post(`/policies/${data.policyId}/endorsements/address-change`, {
        newAddress: data.newAddress,
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
        <h2 className="text-lg font-semibold text-gold mb-2">Address Change Endorsement</h2>
        <p className="text-slate-400 text-sm mb-4">
          Submit an address change endorsement. This creates an audit trail and may require
          insurer notification.
        </p>

        {mutation.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            Failed to submit endorsement. Please try again.
          </div>
        )}

        {mutation.isSuccess && (
          <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-md text-success text-sm">
            Address change endorsement submitted successfully.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Policy</label>
            <select {...register('policyId')} disabled={policiesLoading}>
              <option value="">{policiesLoading ? 'Loading policies…' : 'Select a policy'}</option>
              {policies?.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.client ? `${policy.client.firstName} ${policy.client.lastName}` : policy.clientId} — {policy.policyNumber} — {policy.lineOfBusiness}
                </option>
              ))}
            </select>
            {errors.policyId && <p className="text-red-400 text-xs mt-1">{errors.policyId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">New Address</label>
            <textarea rows={4} {...register('newAddress')} placeholder="Enter the full new residential or postal address" />
            {errors.newAddress && <p className="text-red-400 text-xs mt-1">{errors.newAddress.message}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending || policiesLoading}
              className="btn-primary flex items-center gap-2"
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {mutation.isPending ? 'Submitting…' : 'Submit Endorsement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
