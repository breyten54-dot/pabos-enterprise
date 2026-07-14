import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Loader2, AlertCircle, Search } from 'lucide-react'
import api from '@/lib/api'
import type { Client } from '@/types'

export function Clients() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get<Client[]>('/clients')
      return response.data
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search clients…" className="pl-9 w-64" />
        </div>
        <button onClick={() => navigate('/clients/new')} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Client
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
            Failed to load clients.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-navy text-slate-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">ID Number</th>
                  <th className="px-6 py-3">Consent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {data?.map((client) => (
                  <tr key={client.id} className="hover:bg-navy-50/50">
                    <td className="px-6 py-4 font-medium text-gold">
                      <Link to={`/clients/${client.id}`} className="hover:underline">
                        {client.firstName} {client.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{client.email || '—'}</td>
                    <td className="px-6 py-4">{client.phone || '—'}</td>
                    <td className="px-6 py-4">{client.idNumber || '—'}</td>
                    <td className="px-6 py-4">
                      {client.consentRecords && client.consentRecords.length > 0 && client.consentRecords[0].granted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-success/20 text-success">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No clients found.
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
