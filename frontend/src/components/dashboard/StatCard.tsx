interface StatCardProps {
  title: string
  value: string | number
  description: string
}

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
      <p className="mt-3 text-sm text-slate-400">{description}</p>
    </article>
  )
}
