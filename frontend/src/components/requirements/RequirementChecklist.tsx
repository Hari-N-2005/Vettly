import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/common/Button'
import { Requirement as RequirementItem, RequirementCategory, RequirementPriority } from '@/types'

export type { RequirementItem }

interface RequirementChecklistProps {
  requirements: RequirementItem[]
  onConfirm?: (selectedRequirements: RequirementItem[], allRequirements: RequirementItem[]) => void
}

const CATEGORY_OPTIONS: Array<'All' | RequirementCategory> = [
  'All',
  'Technical',
  'Legal',
  'Financial',
  'Operational',
  'Environmental',
]

const categoryBadgeStyles: Record<RequirementCategory, string> = {
  Technical: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  Legal: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
  Financial: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  Operational: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  Environmental: 'bg-lime-500/20 text-lime-300 border-lime-400/30',
}

const priorityBadgeStyles: Record<RequirementPriority, string> = {
  Critical: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
  Standard: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
}

const normalizeRequirements = (items: RequirementItem[]) => {
  return items.map(item => ({
    ...item,
    requirementText: item.requirementText.trim(),
    sourceExcerpt: item.sourceExcerpt.trim(),
    keywords_detected: item.keywords_detected ?? [],
  }))
}

export default function RequirementChecklist({ requirements, onConfirm }: RequirementChecklistProps) {
  const [editedRequirements, setEditedRequirements] = useState<RequirementItem[]>(() => normalizeRequirements(requirements))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(requirements.map(item => item.id)))
  const [activeCategory, setActiveCategory] = useState<'All' | RequirementCategory>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [openSourceTooltipId, setOpenSourceTooltipId] = useState<string | null>(null)
  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const normalized = normalizeRequirements(requirements)
    setEditedRequirements(normalized)
    setSelectedIds(new Set(normalized.map(item => item.id)))
    setOpenSourceTooltipId(null)
    setExpandedSourceIds(new Set())
  }, [requirements])

  const filteredRequirements = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return editedRequirements.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory

      if (!normalizedQuery) {
        return matchesCategory
      }

      const keywords = item.keywords_detected.join(' ').toLowerCase()
      const searchable = `${item.requirementText} ${item.sourceExcerpt} ${item.category} ${item.priority} ${keywords}`.toLowerCase()

      return matchesCategory && searchable.includes(normalizedQuery)
    })
  }, [activeCategory, editedRequirements, searchQuery])

  const selectedCount = selectedIds.size
  const hasSelections = selectedCount > 0
  const allFilteredSelected =
    filteredRequirements.length > 0 && filteredRequirements.every(item => selectedIds.has(item.id))

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      filteredRequirements.forEach(item => next.add(item.id))
      return next
    })
  }

  const handleDeselectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      filteredRequirements.forEach(item => next.delete(item.id))
      return next
    })
  }

  const handleRequirementTextChange = (id: string, value: string) => {
    setEditedRequirements(prev =>
      prev.map(item => (item.id === id ? { ...item, requirementText: value } : item))
    )
  }

  const handleConfirm = () => {
    if (!hasSelections) {
      return
    }

    const selectedRequirements = editedRequirements.filter(item => selectedIds.has(item.id))
    onConfirm?.(selectedRequirements, editedRequirements)
  }

  const handleToggleSourceTooltip = (id: string) => {
    setOpenSourceTooltipId(prev => (prev === id ? null : id))
  }

  const toggleSourceExpansion = (id: string) => {
    setExpandedSourceIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="bg-legal-slate/60 border border-legal-blue/30 rounded-xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-legal-blue/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Requirement Checklist</h2>
            <p className="text-gray-400 text-sm mt-1">
              Review, edit, and select mandatory requirements before proceeding.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-legal-dark text-gray-300 border border-legal-blue/30">
              Showing {filteredRequirements.length}
            </span>
            <span className="px-3 py-1 rounded-full bg-legal-accent/20 text-legal-accent border border-legal-accent/30">
              Selected {selectedCount}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="requirement-search" className="sr-only">
            Search requirements
          </label>
          <input
            id="requirement-search"
            type="text"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search by requirement text, category, priority, or keyword..."
            className="w-full px-4 py-2.5 bg-legal-dark border border-legal-blue/40 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-legal-accent"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                activeCategory === category
                  ? 'bg-legal-accent text-white border-legal-accent'
                  : 'bg-legal-dark text-gray-300 border-legal-blue/30 hover:border-legal-accent/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleSelectAllFiltered}
            disabled={filteredRequirements.length === 0 || allFilteredSelected}
          >
            Select Visible
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleDeselectAllFiltered}
            disabled={filteredRequirements.length === 0 || filteredRequirements.every(item => !selectedIds.has(item.id))}
          >
            Deselect Visible
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-legal-dark/90">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 w-16">
                Include
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 min-w-[360px]">
                Requirement
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 w-40">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 w-36">
                Priority
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 min-w-[260px]">
                Source Excerpt
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequirements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No requirements match your current filter/search.
                </td>
              </tr>
            )}

            {filteredRequirements.map(item => {
              const isSelected = selectedIds.has(item.id)
              const isTooltipOpen = openSourceTooltipId === item.id
              const isExpanded = expandedSourceIds.has(item.id)
              const previewLimit = 140
              const sourcePreview =
                item.sourceExcerpt.length > previewLimit
                  ? `${item.sourceExcerpt.slice(0, previewLimit)}...`
                  : item.sourceExcerpt

              return (
                <tr
                  key={item.id}
                  className={`border-t border-legal-blue/20 align-top ${
                    isSelected ? 'bg-legal-accent/5' : 'bg-transparent'
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelection(item.id)}
                      className="w-4 h-4 rounded border-legal-blue/50 bg-legal-dark text-legal-accent focus:ring-legal-accent"
                      aria-label={`Include requirement ${item.id}`}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-xs text-gray-500 mb-1">{item.id}</div>
                    <textarea
                      value={item.requirementText}
                      onChange={event => handleRequirementTextChange(item.id, event.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-legal-dark border border-legal-blue/40 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-legal-accent resize-y"
                    />
                    {item.keywords_detected.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.keywords_detected.map(keyword => (
                          <span
                            key={`${item.id}-${keyword}`}
                            className="text-[11px] px-2 py-1 rounded bg-legal-dark border border-legal-blue/30 text-gray-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${categoryBadgeStyles[item.category]}`}
                    >
                      {item.category}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${priorityBadgeStyles[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                  </td>

                  <td className="px-4 py-4 relative">
                    <div className="text-sm text-gray-300">{sourcePreview}</div>
                    <button
                      type="button"
                      onClick={() => handleToggleSourceTooltip(item.id)}
                      className="mt-2 text-xs font-medium text-legal-accent hover:text-legal-gold transition-colors"
                    >
                      {isTooltipOpen ? 'Hide Excerpt' : 'Expand Excerpt'}
                    </button>

                    {isTooltipOpen && (
                      <div className="absolute right-4 mt-2 z-20 w-[min(32rem,calc(100vw-3rem))] rounded-lg border border-legal-blue/40 bg-legal-dark shadow-xl p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-100">Source Excerpt</h4>
                          <button
                            type="button"
                            onClick={() => handleToggleSourceTooltip(item.id)}
                            className="text-xs text-gray-400 hover:text-gray-200"
                          >
                            Close
                          </button>
                        </div>
                        <p
                          className={`text-sm text-gray-300 whitespace-pre-wrap ${
                            isExpanded ? '' : 'line-clamp-4'
                          }`}
                        >
                          {item.sourceExcerpt}
                        </p>
                        {item.sourceExcerpt.length > 200 && (
                          <button
                            type="button"
                            onClick={() => toggleSourceExpansion(item.id)}
                            className="mt-2 text-xs font-medium text-legal-accent hover:text-legal-gold"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-legal-blue/20 bg-legal-dark/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-400">
          Confirm to proceed with {selectedCount} selected requirement{selectedCount === 1 ? '' : 's'}.
        </p>

        <Button
          variant="primary"
          size="md"
          type="button"
          onClick={handleConfirm}
          disabled={!hasSelections}
        >
          Confirm &amp; Proceed
        </Button>
      </div>
    </div>
  )
}
