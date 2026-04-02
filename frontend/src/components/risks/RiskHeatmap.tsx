import { useMemo } from 'react'
import { LabelList, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'

type RiskCategory =
  | 'Liability'
  | 'Cost Escalation'
  | 'Vague Commitment'
  | 'Approval Dependency'
  | 'Scope Creep'

interface RiskHeatmapProps {
  vendors: string[]
  riskMatrix: Record<string, Partial<Record<RiskCategory, number>>>
}

interface HeatCell {
  vendor: string
  category: RiskCategory
  vendorIndex: number
  categoryIndex: number
  value: number
}

const RISK_CATEGORIES: RiskCategory[] = [
  'Liability',
  'Cost Escalation',
  'Vague Commitment',
  'Approval Dependency',
  'Scope Creep',
]

const getRiskColor = (value: number): string => {
  if (value <= 0) return '#FFFFFF'
  if (value <= 2) return '#FACC15'
  if (value <= 4) return '#FB923C'
  return '#EF4444'
}

const legendItems = [
  { label: '0', color: '#FFFFFF' },
  { label: '1-2', color: '#FACC15' },
  { label: '3-4', color: '#FB923C' },
  { label: '5+', color: '#EF4444' },
]

export default function RiskHeatmap({ vendors, riskMatrix }: RiskHeatmapProps) {
  const cells = useMemo<HeatCell[]>(() => {
    return vendors.flatMap((vendor, vendorIndex) =>
      RISK_CATEGORIES.map((category, categoryIndex) => ({
        vendor,
        category,
        vendorIndex,
        categoryIndex,
        value: riskMatrix[vendor]?.[category] ?? 0,
      }))
    )
  }, [riskMatrix, vendors])

  const chartHeight = Math.max(320, RISK_CATEGORIES.length * 68)

  return (
    <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-100">Risk Heatmap</h2>

        <div className="flex flex-wrap items-center gap-3">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-500/40"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="text-xs text-gray-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-full min-h-[320px]">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ScatterChart margin={{ top: 16, right: 16, bottom: 20, left: 24 }}>
            <XAxis
              type="number"
              dataKey="vendorIndex"
              domain={[-0.5, Math.max(vendors.length - 0.5, 0.5)]}
              ticks={vendors.map((_, index) => index)}
              tickFormatter={index => vendors[index] ?? ''}
              tick={{ fill: '#CBD5E1', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(71, 85, 105, 0.6)' }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              type="number"
              dataKey="categoryIndex"
              domain={[-0.5, RISK_CATEGORIES.length - 0.5]}
              ticks={RISK_CATEGORIES.map((_, index) => index)}
              tickFormatter={index => RISK_CATEGORIES[index] ?? ''}
              tick={{ fill: '#CBD5E1', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(71, 85, 105, 0.6)' }}
              tickLine={false}
              interval={0}
              width={140}
            />

            <Scatter
              data={cells}
              shape={(props: any) => {
                const width = 74
                const height = 42
                const x = props.cx - width / 2
                const y = props.cy - height / 2
                const fill = getRiskColor(props.payload.value)

                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx={6}
                      fill={fill}
                      stroke="rgba(30, 41, 59, 0.8)"
                      strokeWidth={1}
                    />
                  </g>
                )
              }}
            >
              <LabelList
                dataKey="value"
                position="center"
                formatter={(value: number) => value.toString()}
                fill="#0F172A"
                style={{ fontSize: 12, fontWeight: 700 }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
