/**
 * Marks features that are feature-gated OFF in production pending real
 * integrations (AI copilot, Redis/MinIO-backed surfaces). In demo/staging
 * these features render for illustration — this badge makes sure no viewer
 * can mistake them for live, regulated brokerage operations.
 *
 * Gates on an explicit per-deployment env var, NOT on `import.meta.env.PROD`,
 * because a staging demo is a production build deployed to a non-production
 * environment (BUILD-STANDARDS #21).
 */
export function SimulatedBadge({ note }: { note?: string }) {
  if (import.meta.env.VITE_APP_ENV === 'production') return null

  return (
    <div
      role="alert"
      className="mb-4 p-3 rounded-lg border border-[#F0C36D] bg-[#FFF7E6] flex items-center gap-3"
    >
      <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#B7791F] text-white text-[11px] font-extrabold uppercase tracking-wide">
        Simulated
      </span>
      <span className="text-[11px] leading-relaxed text-[#7A5A1E]">
        {note ??
          'Shown for demonstration only. This feature is not yet live and does not represent an actual brokerage action or record.'}
      </span>
    </div>
  )
}
