interface StatCardProps {
  title: string
  value: string | number
  description: string
  accent?: 'blue' | 'indigo' | 'amber'
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, { ring: string; value: string; dot: string }> = {
  blue: {
    ring: 'border-blue-500/30 bg-blue-500/5',
    value: 'text-blue-100',
    dot: 'bg-blue-300',
  },
  indigo: {
    ring: 'border-indigo-500/30 bg-indigo-500/5',
    value: 'text-indigo-100',
    dot: 'bg-indigo-300',
  },
  amber: {
    ring: 'border-amber-500/30 bg-amber-500/5',
    value: 'text-amber-100',
    dot: 'bg-amber-300',
  },
}

export default function StatCard({ title, value, description, accent = 'blue' }: StatCardProps) {
  const palette = accentStyles[accent]

  return (
    <article className={`rounded-xl border p-5 shadow-sm ${palette.ring}`}>
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
        {title}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${palette.value}`}>{value}</p>
      <p className="mt-3 text-sm text-slate-400">{description}</p>
    </article>
  )
}
