import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { Policy } from '@/types'

export function Renewals() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery<Policy[]>({
    queryKey: ['policy-renewals'],
    queryFn: async () => {
      const response = await api.get<Policy[]>('/policies/renewals?days=90')
      return response.data
    },
  })

  const mutation = useMutation({
    mutationFn: async (policyId: string) => {
      const response = await api.post(`/policies/${policyId}/renewals`, {
        reason: 'Renewal window',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-renewals'] })
    },
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Active policies expiring in the next 90 days. Queue a RENEWAL amendment and in-app reminder —
        cancellations and commissions are out of this increment.
      </p>

      {mutation.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          Failed to queue renewal.
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 flex justify-center text-gold">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2">
            <AlertCircle size={18} />
            Failed to load renewals.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-navy text-slate-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Policy</th>
                  <th className="px-6 py-3">Expires</th>
                  <th className="px-6 py-3">Premium</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {data?.map((policy) => (
                  <tr key={policy.id} className="hover:bg-navy-50/50">
                    <td className="px-6 py-4 font-medium text-gold">
                      {policy.client ? `${policy.client.firstName} ${policy.client.lastName}` : policy.clientId}
                    </td>
                    <td className="px-6 py-4">{policy.policyNumber}</td>
                    <td className="px-6 py-4">{new Date(policy.expiryDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">R {Number(policy.premium || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="btn-secondary text-sm"
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate(policy.id)}
                      >
                        Queue renewal
                      </button>
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No policies in the 90-day renewal window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
