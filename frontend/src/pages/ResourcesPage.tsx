import { AppShell } from '@/components/layout/AppShell'
import informationMd from '../../../resources/information.md?raw'

export function ResourcesPage() {
  return (
    <AppShell mainClassName="min-h-0 flex-1 overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 bg-grid" aria-hidden />
      <article className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-2 font-headline text-3xl font-bold text-on-surface">Project context</h1>
        <p className="mb-6 text-sm text-on-surface-variant">
          Full text of <code className="font-mono text-primary">resources/information.md</code> (GLOF background for
          framing and judging). Educational only — not operational hazard guidance.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-outline-variant/15 bg-surface-container p-6 font-mono text-[11px] leading-relaxed text-on-surface-variant whitespace-pre-wrap md:p-8 md:text-xs">
          {informationMd.trim()}
        </pre>
      </article>
    </AppShell>
  )
}
