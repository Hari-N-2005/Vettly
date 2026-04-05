interface StatCardProps {
  title: string
  value: string | number
  description: string
  accent?: 'blue' | 'indigo' | 'amber'
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, { ring: string; value: string }> = {
  blue: {
    ring: 'border-blue-500/30 bg-blue-500/5',
    value: 'text-blue-100',
  },
  indigo: {
    ring: 'border-indigo-500/30 bg-indigo-500/5',
    value: 'text-indigo-100',
  },
  amber: {
    ring: 'border-amber-500/30 bg-amber-500/5',
    value: 'text-amber-100',
  },
}

export default function StatCard({ title, value, description, accent = 'blue' }: StatCardProps) {
  const palette = accentStyles[accent]

  return (
    <article className={`rounded-xl border p-5 shadow-sm ${palette.ring}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className={`mt-2 text-3xl font-semibold ${palette.value}`}>{value}</p>
      <p className="mt-3 text-sm text-slate-400">{description}</p>
    </article>
  )
}
