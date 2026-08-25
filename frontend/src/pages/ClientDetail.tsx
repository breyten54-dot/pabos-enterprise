import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  FileText,
  FolderOpen,
} from 'lucide-react'
import { useRef } from 'react'
import api from '@/lib/api'
import type { Client } from '@/types'

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, error } = useQuery<Client>({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await api.get<Client>(`/clients/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append('file', file)
      const response = await api.post(`/documents/upload?clientId=${id}`, body)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] })
      if (fileRef.current) fileRef.current.value = ''
    },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <button onClick={() => navigate('/clients')} className="btn-secondary flex items-center gap-2">
        <ArrowLeft size={16} />
        Back to clients
      </button>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center text-gold py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 flex items-center justify-center gap-2 py-8">
            <AlertCircle size={18} />
            Failed to load client details.
          </div>
        ) : data ? (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gold">
                  {data.firstName} {data.lastName}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Client since {new Date(data.createdAt).toLocaleDateString()}
                </p>
              </div>
              {data.consentRecords && data.consentRecords.length > 0 && data.consentRecords[0].granted ? (
                <span className="inline-flex items-center px-3 py-1 rounded text-sm bg-success/20 text-success">
                  POPIA consent on file
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded text-sm bg-red-500/10 text-red-400">
                  Consent missing
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-navy rounded-md border border-navy-100">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Mail size={14} />
                  Email
                </div>
                <p className="text-slate-100">{data.email || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-navy rounded-md border border-navy-100">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Phone size={14} />
                  Phone
                </div>
                <p className="text-slate-100">{data.phone || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-navy rounded-md border border-navy-100">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <CreditCard size={14} />
                  ID Number
                </div>
                <p className="text-slate-100">{data.idNumber || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-navy rounded-md border border-navy-100">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Calendar size={14} />
                  Last Updated
                </div>
                <p className="text-slate-100">{new Date(data.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gold mb-3 flex items-center gap-2">
              <FileText size={16} />
              Policies
            </h3>
            <ul className="space-y-2 text-sm">
              {data.policies?.map((policy) => (
                <li key={policy.id} className="flex justify-between border-b border-navy-100 pb-2">
                  <span>{policy.policyNumber}</span>
                  <span className="text-slate-400">
                    {policy.status} · {new Date(policy.expiryDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
              {(!data.policies || data.policies.length === 0) && (
                <li className="text-slate-400">No policies.</li>
              )}
            </ul>
            <h3 className="text-sm font-semibold text-gold mt-6 mb-3">Claims</h3>
            <ul className="space-y-2 text-sm">
              {data.claims?.map((claim) => (
                <li key={claim.id} className="flex justify-between border-b border-navy-100 pb-2">
                  <span>{claim.claimNumber}</span>
                  <span className="text-slate-400">{claim.status}</span>
                </li>
              ))}
              {(!data.claims || data.claims.length === 0) && (
                <li className="text-slate-400">No claims.</li>
              )}
            </ul>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gold mb-3 flex items-center gap-2">
              <FolderOpen size={16} />
              Documents
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <input
                ref={fileRef}
                type="file"
                aria-label="Upload client document"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) upload.mutate(file)
                }}
              />
            </div>
            {upload.error && (
              <p className="text-red-400 text-sm mb-2">Upload failed. Please try again.</p>
            )}
            <ul className="space-y-2 text-sm">
              {data.documents?.map((doc) => (
                <li key={doc.id} className="flex justify-between border-b border-navy-100 pb-2">
                  <span>{doc.originalName}</span>
                  <span className="text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </li>
              ))}
              {(!data.documents || data.documents.length === 0) && (
                <li className="text-slate-400">No documents on file.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
