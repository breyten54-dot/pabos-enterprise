import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, Send, AlertCircle, CheckCircle2, Flag, ListTodo } from 'lucide-react'
import api from '@/lib/api'
import type { IntakeRequest, IntakeResponse } from '@/types'

const schema = z.object({
  message: z.string().min(10, 'Paste a meaningful client message'),
})

type FormData = z.infer<typeof schema>

export function AiIntake() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation<IntakeResponse, Error, IntakeRequest>({
    mutationFn: async (data) => {
      const response = await api.post<IntakeResponse>('/ai/intake', data)
      return response.data
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  const result = mutation.data

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-gold" />
          <h2 className="text-lg font-semibold text-gold">AI Intake</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Paste a client message below. The AI assistant will analyse it, suggest an activity code,
          highlight missing information, and draft a response. All outputs are advisory and require
          human approval before any client-facing action.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Client Message</label>
            <textarea
              rows={6}
              {...register('message')}
              placeholder="e.g. Hi, I moved to 12 Main Road last month. Can you update my address for my car insurance? Reg: ABC123 GP."
              className="w-full"
            />
            {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>}
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending ? 'Analysing…' : <><Send size={18} /> Analyse Intake</>}
          </button>
        </form>

        {mutation.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            Failed to analyse message. Please try again.
          </div>
        )}
      </div>

      {result && (
        <div className="card space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-success" />
            <h3 className="text-lg font-semibold text-gold">AI Analysis</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-navy rounded-md border border-navy-100">
              <p className="text-xs text-slate-400 uppercase mb-1">Activity Code</p>
              <p className="text-gold font-semibold">{result.activityCode}</p>
            </div>
            <div className="p-4 bg-navy rounded-md border border-navy-100">
              <p className="text-xs text-slate-400 uppercase mb-1">Priority</p>
              <p className="font-semibold">{result.priority}</p>
            </div>
            <div className="p-4 bg-navy rounded-md border border-navy-100">
              <p className="text-xs text-slate-400 uppercase mb-1">Responsible Department</p>
              <p>{result.responsibleDepartment}</p>
            </div>
            <div className="p-4 bg-navy rounded-md border border-navy-100">
              <p className="text-xs text-slate-400 uppercase mb-1">Summary</p>
              <p className="text-sm">{result.summary}</p>
            </div>
          </div>

          {result.missingInfo.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <ListTodo size={16} className="text-gold" />
                Missing Information
              </h4>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                {result.missingInfo.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestedTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2">Suggested Tasks</h4>
              <ol className="list-decimal list-inside text-slate-300 text-sm space-y-1">
                {result.suggestedTasks.map((task, index) => (
                  <li key={index}>{task}</li>
                ))}
              </ol>
            </div>
          )}

          {result.complianceFlags.length > 0 && (
            <div className="p-4 bg-gold/5 border border-gold/20 rounded-md">
              <h4 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
                <Flag size={16} />
                Compliance Flags
              </h4>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                {result.complianceFlags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Draft Response</h4>
            <div className="p-4 bg-navy rounded-md border border-navy-100 text-slate-300 text-sm whitespace-pre-wrap">
              {result.draftResponse}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Draft only — review and approve before sending to the client.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
