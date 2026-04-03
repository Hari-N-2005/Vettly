import { useMemo } from 'react'
import EmptyState from '@/components/common/EmptyState'
import { useProjectStore } from '@/stores/projectStore'

export default function RequirementsPage() {
  const { currentProject } = useProjectStore()

  const groupedRequirements = useMemo(() => {
    if (!currentProject) {
      return [] as Array<{
        category: string
        items: Array<{
          id: string
          text: string
          category?: string
          priority?: string
          order: number
        }>
      }>
    }

    const buckets = new Map<string, typeof currentProject.requirements>()
    currentProject.requirements.forEach(requirement => {
      const category = requirement.category || 'Operational'
      const existing = buckets.get(category) || []
      buckets.set(category, [...existing, requirement])
    })

    return Array.from(buckets.entries()).map(([category, items]) => ({ category, items }))
  }, [currentProject])

  if (!currentProject) {
    return (
      <EmptyState
        variant="requirements"
        title="No active project selected"
        description="Open a project from the RFP Uploads page to review structured requirements here."
      />
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-slate-100">Requirements</h2>
        <p className="mt-1 text-sm text-slate-400">
          Structured requirement view for {currentProject.name}, grouped by compliance category.
        </p>
      </section>

      {groupedRequirements.map(group => (
        <section key={group.category} className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <header className="border-b border-slate-800 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-100">{group.category}</h3>
            <p className="text-sm text-slate-400">{group.items.length} requirements</p>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Requirement</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Order</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-slate-200">{item.text}</td>
                    <td className="px-4 py-3 text-slate-300">{item.priority || 'Standard'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.order}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
