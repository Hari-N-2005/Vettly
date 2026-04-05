interface BrandProps {
  sizeClassName?: string
  textClassName?: string
  stacked?: boolean
}

export default function Brand({
  sizeClassName = 'h-10 w-10',
  textClassName = 'text-2xl font-semibold text-slate-100',
  stacked = false,
}: BrandProps) {
  return (
    <div className={`flex items-center ${stacked ? 'flex-col text-center gap-2' : 'gap-3'}`}>
      <img
        src="/vettly-logo.png"
        alt="Vettly logo"
        className={`${sizeClassName} rounded-md object-cover`}
      />
      <span className={textClassName}>Vettly</span>
    </div>
  )
}
