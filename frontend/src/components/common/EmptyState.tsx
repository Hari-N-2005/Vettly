import React from 'react'

type EmptyStateVariant = 'requirements' | 'vendors' | 'generic'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  variant?: EmptyStateVariant
  className?: string
  icon?: React.ReactNode
}

function DefaultIllustration({ variant }: { variant: EmptyStateVariant }) {
  if (variant === 'vendors') {
    return (
      <svg width="84" height="84" viewBox="0 0 84 84" fill="none" className="text-legal-accent" aria-hidden="true">
        <rect x="12" y="26" width="60" height="40" rx="10" className="fill-current opacity-20" />
        <rect x="20" y="34" width="26" height="4" rx="2" className="fill-current opacity-80" />
        <rect x="20" y="42" width="44" height="4" rx="2" className="fill-current opacity-60" />
        <rect x="20" y="50" width="36" height="4" rx="2" className="fill-current opacity-60" />
        <circle cx="62" cy="22" r="10" className="fill-current opacity-25" />
        <path d="M62 18V26M58 22H66" className="stroke-current" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (variant === 'requirements') {
    return (
      <svg width="84" height="84" viewBox="0 0 84 84" fill="none" className="text-legal-gold" aria-hidden="true">
        <rect x="20" y="12" width="44" height="60" rx="8" className="fill-current opacity-20" />
        <rect x="28" y="24" width="28" height="3.5" rx="1.75" className="fill-current opacity-80" />
        <rect x="28" y="33" width="22" height="3.5" rx="1.75" className="fill-current opacity-70" />
        <rect x="28" y="42" width="26" height="3.5" rx="1.75" className="fill-current opacity-70" />
        <circle cx="29" cy="53" r="2" className="fill-current opacity-90" />
        <circle cx="29" cy="60" r="2" className="fill-current opacity-90" />
        <path d="M34 53H52M34 60H48" className="stroke-current opacity-80" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" className="text-legal-accent" aria-hidden="true">
      <circle cx="42" cy="42" r="28" className="fill-current opacity-20" />
      <path d="M30 42H54M42 30V54" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'generic',
  className = '',
  icon,
}: EmptyStateProps) {
  return (
    <section className={`rounded-2xl border border-legal-blue/30 bg-legal-slate/50 p-8 text-center shadow-xl ${className}`}>
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-legal-blue/30 bg-legal-dark/50">
        {icon ?? <DefaultIllustration variant={variant} />}
      </div>

      <h3 className="mt-5 text-2xl font-bold text-gray-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-gray-400">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg border border-legal-accent/50 bg-legal-accent/20 px-5 py-2.5 text-sm font-semibold text-legal-accent hover:bg-legal-accent/30"
        >
          {actionLabel}
        </button>
      )}
    </section>
  )
}
