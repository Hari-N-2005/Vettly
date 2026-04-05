import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function SettingsPage() {
  const { user } = useAuthStore()

  const environment = useMemo(
    () => [
      { key: 'Workspace', value: 'Vettly Enterprise' },
      { key: 'Role', value: 'Procurement Analyst' },
      { key: 'Email', value: user?.email || 'Not available' },
      { key: 'Theme', value: 'Professional Dark' },
    ],
    [user?.email]
  )

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-blue-500/25 bg-gradient-to-r from-slate-900 via-blue-900/20 to-slate-900 p-5">
        <h2 className="text-2xl font-semibold text-slate-100">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">
          Workspace profile and interface defaults for your procurement team.
        </p>
      </section>

      <section className="rounded-xl border border-blue-500/20 bg-slate-900/95 shadow-sm">
        <header className="border-b border-blue-500/15 px-5 py-4">
          <h3 className="text-lg font-semibold text-blue-100">User Profile</h3>
        </header>

        <dl className="divide-y divide-blue-500/10">
          {environment.map(item => (
            <div key={item.key} className="flex items-center justify-between px-5 py-4 text-sm">
              <dt className="text-slate-400">{item.key}</dt>
              <dd className="font-medium text-slate-200">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
