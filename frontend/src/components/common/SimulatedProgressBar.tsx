interface SimulatedProgressBarProps {
  progress: number
  label: string
  helperText?: string
}

export default function SimulatedProgressBar({ progress, label, helperText }: SimulatedProgressBarProps) {
  return (
    <div className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-100">{label}</p>
          {helperText && <p className="text-xs text-gray-400 mt-1">{helperText}</p>}
        </div>
        <p className="text-sm font-semibold text-legal-accent tabular-nums">{progress}%</p>
      </div>

      <div className="h-3 rounded-full bg-legal-dark overflow-hidden border border-legal-blue/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-legal-accent via-cyan-400 to-legal-gold transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>Starting</span>
        <span>In progress</span>
        <span>Ready</span>
      </div>
    </div>
  )
}
