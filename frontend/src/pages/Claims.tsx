import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import type { Claim } from '@/types'

export function Claims() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery<Claim[]>({
    queryKey: ['claims'],
    queryFn: async () => {
      const response = await api.get<Claim[]>('/claims')
      return response.data
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Registered claims only — no settlement in this increment.</p>
        <button onClick={() => navigate('/claims/new')} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Register claim
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 flex justify-center text-gold">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2">
            <AlertCircle size={18} />
            Failed to load claims.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-navy text-slate-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Claim</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Policy</th>
                  <th className="px-6 py-3">Incident</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {data?.map((claim) => (
                  <tr key={claim.id} className="hover:bg-navy-50/50">
                    <td className="px-6 py-4 font-medium text-gold">{claim.claimNumber}</td>
                    <td className="px-6 py-4">
                      {claim.client ? `${claim.client.firstName} ${claim.client.lastName}` : claim.clientId}
                    </td>
                    <td className="px-6 py-4">{claim.policy?.policyNumber || claim.policyId}</td>
                    <td className="px-6 py-4">{new Date(claim.incidentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gold/20 text-gold">
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No claims registered.
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
