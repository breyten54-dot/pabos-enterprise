import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, AlertCircle, Search } from 'lucide-react'
import api from '@/lib/api'
import type { Policy } from '@/types'

export function Policies() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery<Policy[]>({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await api.get<Policy[]>('/policies')
      return response.data
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search policies…" className="pl-9 w-64" />
        </div>
        <button onClick={() => navigate('/policies/new')} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Policy
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
            Failed to load policies.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-navy text-slate-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Policy Number</th>
                  <th className="px-6 py-3">Line of Business</th>
                  <th className="px-6 py-3">Premium</th>
                  <th className="px-6 py-3">Sum Insured</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {data?.map((policy) => (
                  <tr key={policy.id} className="hover:bg-navy-50/50">
                    <td className="px-6 py-4 font-medium text-gold">
                      {policy.client ? `${policy.client.firstName} ${policy.client.lastName}` : policy.clientId}
                    </td>
                    <td className="px-6 py-4">{policy.policyNumber}</td>
                    <td className="px-6 py-4">{policy.lineOfBusiness}</td>
                    <td className="px-6 py-4">R {Number(policy.premium || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">R {Number(policy.sumInsured || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-success/20 text-success">
                        {policy.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No policies found.
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
