'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataPoint {
  label: string
  value: number
  color?: string
}

export interface SeriesDataPoint {
  label: string
  values: number[]
}

export interface ChartSeries {
  name: string
  color: string
}

// ─── Color Palette ────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
]

function getColor(index: number, customColor?: string): string {
  return customColor || CHART_COLORS[index % CHART_COLORS.length] || '#3b82f6'
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatValue(val: any): string {
  if (val === undefined || val === null) return '0'
  const num = Number(val)
  if (isNaN(num)) return '0'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 600, height: 280 })

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0) {
          setSize({ width: Math.floor(width), height: Math.floor(height) })
        }
      }
    })

    observer.observe(el)
    // Initial measurement
    const rect = el.getBoundingClientRect()
    if (rect.width > 0) {
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    }

    return () => observer.disconnect()
  }, [ref, ref.current])

  return size
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: string
  color?: string
}

function ChartTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.visible) return null

  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-150 ease-out"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: 'translate(-50%, -110%)',
      }}
    >
      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-700/50 whitespace-nowrap backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {tooltip.color && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: tooltip.color }}
            />
          )}
          <span className="font-medium">{tooltip.content}</span>
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
          style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #111827',
          }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AREA CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface AreaChartProps {
  data: DataPoint[]
  height?: number
  color?: string
  gradientFrom?: string
  gradientTo?: string
  showGrid?: boolean
  showDots?: boolean
  showLabels?: boolean
  showValues?: boolean
  curved?: boolean
  title?: string
}

export function AreaChart({
  data,
  height = 280,
  color = '#3b82f6',
  gradientFrom,
  gradientTo,
  showGrid = true,
  showDots = true,
  showLabels = true,
  showValues = false,
  curved = true,
  title,
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useContainerSize(containerRef)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return <div ref={containerRef} style={{ height }} className="w-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
  }

  const padding = { top: 30, right: 20, bottom: 50, left: 55 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (chartWidth <= 0 || chartHeight <= 0) {
    return <div ref={containerRef} style={{ height }} className="w-full" />
  }

  const maxValue = Math.max(...data.map((d) => d.value)) * 1.15
  const minValue = 0

  const getX = (i: number) =>
    padding.left + (i / (data.length - 1)) * chartWidth
  const getY = (v: number) =>
    padding.top + chartHeight - ((v - minValue) / (maxValue - minValue)) * chartHeight

  // Build path (curved or straight)
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }))
  let linePath: string
  let areaPath: string

  if (curved && points.length > 2) {
    // Catmull-Rom to Bézier
    const bezier: string[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)]!
      const p1 = points[i]!
      const p2 = points[i + 1]!
      const p3 = points[Math.min(i + 2, points.length - 1)]!

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      bezier.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`)
    }
    linePath = `M ${points[0]!.x},${points[0]!.y} ${bezier.join(' ')}`
    areaPath = `${linePath} L ${points[points.length - 1]!.x},${padding.top + chartHeight} L ${points[0]!.x},${padding.top + chartHeight} Z`
  } else {
    linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
    areaPath = `${linePath} L ${points[points.length - 1]!.x},${padding.top + chartHeight} L ${points[0]!.x},${padding.top + chartHeight} Z`
  }

  // Grid lines (horizontal)
  const gridLines = 5
  const gridStep = (maxValue - minValue) / gridLines

  const gFrom = gradientFrom || color
  const gTo = gradientTo || color + '05'
  const gradientId = `area-gradient-${color.replace('#', '')}`

  return (
    <div ref={containerRef} className="w-full relative" style={{ height }}>
      {title && (
        <div className="absolute top-1 left-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gFrom} stopOpacity={0.3} />
            <stop offset="100%" stopColor={gTo} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Grid */}
        {showGrid &&
          Array.from({ length: gridLines + 1 }, (_, i) => {
            const y = getY(minValue + gridStep * i)
            const val = minValue + gridStep * i
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4,4"
                  strokeWidth={0.8}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {formatValue(val)}
                </text>
              </g>
            )
          })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 2px 4px ${color}40)`,
          }}
        />

        {/* Dots */}
        {showDots &&
          points.map((p, i) => (
            <g key={`dot-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill="white"
                stroke={color}
                strokeWidth={2.5}
                className="transition-all duration-200"
                style={{
                  filter:
                    hoveredIndex === i
                      ? `drop-shadow(0 0 8px ${color}80)`
                      : 'none',
                }}
              />
              {showValues && data[i] && (
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-600 font-semibold"
                >
                  {formatValue(data[i]!.value)}
                </text>
              )}
            </g>
          ))}

        {/* Labels */}
        {showLabels &&
          data.map((d, i) => {
            const totalPoints = data.length
            const skipInterval = Math.ceil(totalPoints / 6)
            if (totalPoints > 8 && i % skipInterval !== 0 && i !== totalPoints - 1) {
              return null
            }
            if (!d.label) return null
            return (
              <text
                key={`label-${i}`}
                x={getX(i)}
                y={padding.top + chartHeight + 22}
                textAnchor="middle"
                className="text-[10px] fill-gray-500"
              >
                {d.label}
              </text>
            )
          })}

        {/* Hit areas */}
        {data.map((d, i) => (
          <rect
            key={`hit-${i}`}
            x={getX(i) - chartWidth / data.length / 2}
            y={padding.top}
            width={chartWidth / data.length}
            height={chartHeight}
            fill="transparent"
            onMouseEnter={(e) => {
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                setTooltip({
                  visible: true,
                  x: getX(i),
                  y: getY(d.value) - 4,
                  content: `${d.label}: ${formatValue(d.value)}`,
                  color,
                })
                setHoveredIndex(i)
              }
            }}
            onMouseLeave={() => {
              setTooltip((t) => ({ ...t, visible: false }))
              setHoveredIndex(null)
            }}
          />
        ))}
      </svg>

      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BAR CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface BarChartProps {
  data: DataPoint[]
  height?: number
  barColor?: string
  showGrid?: boolean
  showValues?: boolean
  horizontal?: boolean
  title?: string
  barRadius?: number
}

export function BarChart({
  data,
  height = 280,
  barColor,
  showGrid = true,
  showValues = true,
  horizontal = false,
  title,
  barRadius = 6,
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useContainerSize(containerRef)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return <div ref={containerRef} style={{ height }} className="w-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
  }

  const padding = horizontal
    ? { top: 20, right: 30, bottom: 30, left: 120 }
    : { top: 30, right: 20, bottom: 60, left: 55 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (chartWidth <= 0 || chartHeight <= 0) {
    return <div ref={containerRef} style={{ height }} className="w-full" />
  }

  const maxValue = Math.max(...data.map((d) => d.value)) * 1.15

  if (horizontal) {
    const barHeight = Math.min(32, chartHeight / data.length - 8)
    const gap = (chartHeight - barHeight * data.length) / (data.length + 1)

    return (
      <div ref={containerRef} className="w-full relative" style={{ height }}>
        {title && (
          <div className="absolute top-1 left-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
          {data.map((d, i) => {
            const color = getColor(i, d.color || barColor)
            const barW = (d.value / maxValue) * chartWidth
            const y = padding.top + gap * (i + 1) + barHeight * i
            const gradId = `bar-h-grad-${i}`

            return (
              <g key={i}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                {/* Label */}
                <text
                  x={padding.left - 8}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  className="text-[11px] fill-gray-600 font-medium"
                >
                  {d.label.length > 16 ? d.label.slice(0, 16) + '…' : d.label}
                </text>
                {/* Background track */}
                <rect
                  x={padding.left}
                  y={y}
                  width={chartWidth}
                  height={barHeight}
                  rx={barRadius}
                  ry={barRadius}
                  fill="#f3f4f6"
                />
                {/* Bar */}
                <rect
                  x={padding.left}
                  y={y}
                  width={Math.max(barW, barRadius * 2)}
                  height={barHeight}
                  rx={barRadius}
                  ry={barRadius}
                  fill={`url(#${gradId})`}
                  className="transition-all duration-300"
                  style={{
                    filter:
                      hoveredIndex === i
                        ? `drop-shadow(0 2px 8px ${color}60)`
                        : 'none',
                    opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.5 : 1,
                  }}
                  onMouseEnter={() => {
                    setTooltip({
                      visible: true,
                      x: padding.left + barW / 2,
                      y: y,
                      content: `${d.label}: ${formatValue(d.value)}`,
                      color,
                    })
                    setHoveredIndex(i)
                  }}
                  onMouseLeave={() => {
                    setTooltip((t) => ({ ...t, visible: false }))
                    setHoveredIndex(null)
                  }}
                />
                {/* Value */}
                {showValues && (
                  <text
                    x={padding.left + barW + 8}
                    y={y + barHeight / 2 + 4}
                    className="text-[10px] fill-gray-500 font-semibold"
                  >
                    {formatValue(d.value)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        <ChartTooltip tooltip={tooltip} />
      </div>
    )
  }

  // Vertical bars
  const barWidth = Math.min(48, chartWidth / data.length - 12)
  const barGap = (chartWidth - barWidth * data.length) / (data.length + 1)

  // Grid
  const gridLines = 5
  const gridStep = maxValue / gridLines

  return (
    <div ref={containerRef} className="w-full relative" style={{ height }}>
      {title && (
        <div className="absolute top-1 left-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
        {/* Grid */}
        {showGrid &&
          Array.from({ length: gridLines + 1 }, (_, i) => {
            const y = padding.top + chartHeight - (gridStep * i / maxValue) * chartHeight
            return (
              <g key={`vgrid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4,4"
                  strokeWidth={0.8}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {formatValue(gridStep * i)}
                </text>
              </g>
            )
          })}

        {/* Bars */}
        {data.map((d, i) => {
          const color = getColor(i, d.color || barColor)
          const barH = (d.value / maxValue) * chartHeight
          const x = padding.left + barGap * (i + 1) + barWidth * i
          const y = padding.top + chartHeight - barH
          const gradId = `bar-v-grad-${i}`

          return (
            <g key={i}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={barRadius}
                ry={barRadius}
                fill={`url(#${gradId})`}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  filter:
                    hoveredIndex === i
                      ? `drop-shadow(0 4px 12px ${color}50)`
                      : 'none',
                  opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.45 : 1,
                }}
                onMouseEnter={() => {
                  setTooltip({
                    visible: true,
                    x: x + barWidth / 2,
                    y: y,
                    content: `${d.label}: ${formatValue(d.value)}`,
                    color,
                  })
                  setHoveredIndex(i)
                }}
                onMouseLeave={() => {
                  setTooltip((t) => ({ ...t, visible: false }))
                  setHoveredIndex(null)
                }}
              />
              {/* Value on top */}
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-500 font-semibold"
                >
                  {formatValue(d.value)}
                </text>
              )}
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className="text-[10px] fill-gray-500"
              >
                {d.label.length > 8 ? d.label.slice(0, 8) + '…' : d.label}
              </text>
            </g>
          )
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GROUPED BAR CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface GroupedBarChartProps {
  data: SeriesDataPoint[]
  series: ChartSeries[]
  height?: number
  showGrid?: boolean
  showValues?: boolean
  title?: string
  barRadius?: number
}

export function GroupedBarChart({
  data,
  series,
  height = 300,
  showGrid = true,
  showValues = false,
  title,
  barRadius = 4,
}: GroupedBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useContainerSize(containerRef)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  })
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return <div ref={containerRef} style={{ height }} className="w-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
  }

  const padding = { top: 40, right: 20, bottom: 60, left: 55 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (chartWidth <= 0 || chartHeight <= 0) {
    return <div ref={containerRef} style={{ height }} className="w-full" />
  }

  const allValues = data.flatMap((d) => d.values)
  const maxValue = Math.max(...allValues) * 1.15

  const groupWidth = chartWidth / data.length
  const barWidth = Math.min(28, (groupWidth - 16) / series.length)
  const groupPadding = (groupWidth - barWidth * series.length) / 2

  const gridLines = 5
  const gridStep = maxValue / gridLines

  return (
    <div ref={containerRef} className="w-full relative" style={{ height }}>
      {title && (
        <div className="absolute top-1 left-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </div>
      )}
      {/* Legend */}
      <div className="absolute top-1 right-2 flex gap-3">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[10px] text-gray-500 font-medium">{s.name}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
        {/* Grid */}
        {showGrid &&
          Array.from({ length: gridLines + 1 }, (_, i) => {
            const y =
              padding.top +
              chartHeight -
              ((gridStep * i) / maxValue) * chartHeight
            return (
              <g key={`ggrid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4,4"
                  strokeWidth={0.8}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {formatValue(gridStep * i)}
                </text>
              </g>
            )
          })}

        {/* Grouped Bars */}
        {data.map((group, gi) => {
          const groupX = padding.left + gi * groupWidth

          return (
            <g key={gi}>
              {series.map((s, si) => {
                const val = group.values[si] || 0
                const barH = (val / maxValue) * chartHeight
                const x = groupX + groupPadding + si * barWidth
                const y = padding.top + chartHeight - barH
                const key = `${gi}-${si}`
                const gradId = `gbar-grad-${gi}-${si}`

                return (
                  <g key={key}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={s.color}
                          stopOpacity={0.95}
                        />
                        <stop
                          offset="100%"
                          stopColor={s.color}
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barH, 0)}
                      rx={barRadius}
                      ry={barRadius}
                      fill={`url(#${gradId})`}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        opacity:
                          hoveredKey !== null && hoveredKey !== key ? 0.35 : 1,
                        filter:
                          hoveredKey === key
                            ? `drop-shadow(0 3px 8px ${s.color}50)`
                            : 'none',
                      }}
                      onMouseEnter={() => {
                        setTooltip({
                          visible: true,
                          x: x + barWidth / 2,
                          y,
                          content: `${group.label} – ${s.name}: ${formatValue(val)}`,
                          color: s.color,
                        })
                        setHoveredKey(key)
                      }}
                      onMouseLeave={() => {
                        setTooltip((t) => ({ ...t, visible: false }))
                        setHoveredKey(null)
                      }}
                    />
                    {showValues && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        className="text-[9px] fill-gray-500 font-semibold"
                      >
                        {formatValue(val)}
                      </text>
                    )}
                  </g>
                )
              })}
              {/* Group label */}
              <text
                x={groupX + groupWidth / 2}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-[10px] fill-gray-500"
              >
                {group.label}
              </text>
            </g>
          )
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DONUT CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface DonutChartProps {
  data: DataPoint[]
  height?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  title?: string
  showLegend?: boolean
}

export function DonutChart({
  data,
  height = 280,
  thickness = 35,
  centerLabel,
  centerValue,
  title,
  showLegend = true,
}: DonutChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useContainerSize(containerRef)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return <div ref={containerRef} style={{ height }} className="w-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const legendWidth = showLegend ? 160 : 0
  const svgWidth = Math.max(width - legendWidth - 12, 150)
  const cx = svgWidth / 2
  const cy = height / 2
  const outerRadius = Math.min(cx, cy) - 10
  const innerRadius = outerRadius - thickness

  // Compute arcs
  let cumulativeAngle = -Math.PI / 2 // Start at 12 o'clock
  const displayTotal = total || 1
  const arcs = data.map((d, i) => {
    const angle = Math.min((d.value / displayTotal) * 2 * Math.PI, 2 * Math.PI - 0.0001)
    const start = cumulativeAngle
    const end = cumulativeAngle + angle
    cumulativeAngle = end
    return {
      ...d,
      index: i,
      startAngle: start,
      endAngle: end,
      percentage: ((d.value / displayTotal) * 100).toFixed(1),
      color: getColor(i, d.color),
    }
  })

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center gap-2"
      style={{ height }}
    >
      <svg viewBox={`0 0 ${svgWidth} ${height}`} width={svgWidth} height={height} className="flex-shrink-0">
        {title && (
          <text
            x={cx}
            y={16}
            textAnchor="middle"
            className="text-[11px] fill-gray-500 font-semibold uppercase tracking-wider"
          >
            {title}
          </text>
        )}

        {arcs.map((arc) => {
          const isHovered = hoveredIndex === arc.index
          const midAngle = (arc.startAngle + arc.endAngle) / 2
          const hoverOffset = isHovered ? 6 : 0
          const translateX = hoverOffset * Math.cos(midAngle)
          const translateY = hoverOffset * Math.sin(midAngle)

          // Outer coordinates
          const x1Out = cx + outerRadius * Math.cos(arc.startAngle)
          const y1Out = cy + outerRadius * Math.sin(arc.startAngle)
          const x2Out = cx + outerRadius * Math.cos(arc.endAngle)
          const y2Out = cy + outerRadius * Math.sin(arc.endAngle)

          // Inner coordinates
          const x1In = cx + innerRadius * Math.cos(arc.startAngle)
          const y1In = cy + innerRadius * Math.sin(arc.startAngle)
          const x2In = cx + innerRadius * Math.cos(arc.endAngle)
          const y2In = cy + innerRadius * Math.sin(arc.endAngle)

          const largeArc = arc.endAngle - arc.startAngle > Math.PI ? 1 : 0

          // Path:
          // 1. Move to outer start (x1Out, y1Out)
          // 2. Clockwise arc to outer end (x2Out, y2Out)
          // 3. Line to inner end (x2In, y2In)
          // 4. Counter-clockwise arc to inner start (x1In, y1In)
          // 5. Close path (Z)
          const pathD = `M ${x1Out},${y1Out} ` +
            `A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${x2Out},${y2Out} ` +
            `L ${x2In},${y2In} ` +
            `A ${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x1In},${y1In} ` +
            `Z`

          return (
            <g
              key={arc.index}
              style={{
                transform: `translate(${translateX}px, ${translateY}px)`,
                transition: 'transform 0.2s ease, filter 0.2s ease',
                filter: isHovered
                  ? `drop-shadow(0 4px 12px ${arc.color}60)`
                  : 'none',
              }}
              onMouseEnter={() => setHoveredIndex(arc.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <path d={pathD} fill={arc.color} opacity={
                hoveredIndex !== null && !isHovered ? 0.4 : 1
              } />
            </g>
          )
        })}

        {/* Center label */}
        {(centerLabel || centerValue) && (
          <g>
            {centerValue && (
              <text
                x={cx}
                y={cy - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xl fill-gray-900 font-bold"
              >
                {centerValue}
              </text>
            )}
            {centerLabel && (
              <text
                x={cx}
                y={cy + 18}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] fill-gray-400 font-medium"
              >
                {centerLabel}
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2 pr-2 flex-shrink-0" style={{ width: legendWidth }}>
          {arcs.map((arc) => (
            <div
              key={arc.index}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer ${
                hoveredIndex === arc.index
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setHoveredIndex(arc.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: arc.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-700 truncate">
                  {arc.label}
                </div>
                <div className="text-[10px] text-gray-400">
                  {arc.percentage}% · {formatValue(arc.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MULTI-LINE CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface MultiLineChartProps {
  data: SeriesDataPoint[]
  series: ChartSeries[]
  height?: number
  showGrid?: boolean
  showDots?: boolean
  curved?: boolean
  title?: string
}

export function MultiLineChart({
  data,
  series,
  height = 280,
  showGrid = true,
  showDots = true,
  curved = true,
  title,
}: MultiLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useContainerSize(containerRef)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  })
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return <div ref={containerRef} style={{ height }} className="w-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
  }

  const padding = { top: 40, right: 20, bottom: 50, left: 55 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (chartWidth <= 0 || chartHeight <= 0) {
    return <div ref={containerRef} style={{ height }} className="w-full" />
  }

  const allValues = data.flatMap((d) => d.values)
  const maxValue = Math.max(...allValues) * 1.15

  const getX = (i: number) =>
    padding.left + (i / (data.length - 1)) * chartWidth
  const getY = (v: number) =>
    padding.top + chartHeight - (v / maxValue) * chartHeight

  const gridLines = 5
  const gridStep = maxValue / gridLines

  // Build line paths per series
  const linePaths = series.map((s, si) => {
    const points = data.map((d, i) => ({
      x: getX(i),
      y: getY(d.values[si] || 0),
    }))

    let path: string
    if (curved && points.length > 2) {
      const bezier: string[] = []
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)]!
        const p1 = points[i]!
        const p2 = points[i + 1]!
        const p3 = points[Math.min(i + 2, points.length - 1)]!
        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6
        bezier.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`)
      }
      path = `M ${points[0]!.x},${points[0]!.y} ${bezier.join(' ')}`
    } else {
      path = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
        .join(' ')
    }

    return { path, points, color: s.color, name: s.name }
  })

  return (
    <div ref={containerRef} className="w-full relative" style={{ height }}>
      {title && (
        <div className="absolute top-1 left-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </div>
      )}
      {/* Legend */}
      <div className="absolute top-1 right-2 flex gap-3">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[10px] text-gray-500 font-medium">
              {s.name}
            </span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
        {/* Grid */}
        {showGrid &&
          Array.from({ length: gridLines + 1 }, (_, i) => {
            const y = getY(gridStep * i)
            return (
              <g key={`mlgrid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4,4"
                  strokeWidth={0.8}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {formatValue(gridStep * i)}
                </text>
              </g>
            )
          })}

        {/* Lines */}
        {linePaths.map((lp, si) => (
          <path
            key={`line-${si}`}
            d={lp.path}
            fill="none"
            stroke={lp.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={hoveredKey !== null && !hoveredKey?.startsWith(`${si}-`) ? 0.2 : 1}
            style={{
              filter: `drop-shadow(0 1px 3px ${lp.color}30)`,
              transition: 'opacity 0.2s ease',
            }}
          />
        ))}

        {/* Dots + Hit areas */}
        {showDots &&
          linePaths.map((lp, si) =>
            lp.points.map((p, di) => {
              const key = `${si}-${di}`
              const isHovered = hoveredKey === key
              return (
                <circle
                  key={key}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="white"
                  stroke={lp.color}
                  strokeWidth={2}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered
                      ? `drop-shadow(0 0 6px ${lp.color}80)`
                      : 'none',
                  }}
                  onMouseEnter={() => {
                    setTooltip({
                      visible: true,
                      x: p.x,
                      y: p.y - 4,
                      content: `${data[di]!.label} – ${lp.name}: ${formatValue(data[di]!.values[si] || 0)}`,
                      color: lp.color,
                    })
                    setHoveredKey(key)
                  }}
                  onMouseLeave={() => {
                    setTooltip((t) => ({ ...t, visible: false }))
                    setHoveredKey(null)
                  }}
                />
              )
            })
          )}

        {/* Labels */}
        {data.map((d, i) => {
          const totalPoints = data.length
          const skipInterval = Math.ceil(totalPoints / 6)
          if (totalPoints > 8 && i % skipInterval !== 0 && i !== totalPoints - 1) {
            return null
          }
          if (!d.label) return null
          return (
            <text
              key={`mllabel-${i}`}
              x={getX(i)}
              y={padding.top + chartHeight + 22}
              textAnchor="middle"
              className="text-[10px] fill-gray-500"
            >
              {d.label}
            </text>
          )
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SPARKLINE (mini inline chart)
// ═══════════════════════════════════════════════════════════════════════════════

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = '#3b82f6',
  showArea = true,
}: SparklineProps) {
  if (!data || data.length < 2) return null

  const pad = 2
  const cw = width - pad * 2
  const ch = height - pad * 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * cw,
    y: pad + ch - ((v - min) / range) * ch,
  }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1]!.x},${height - pad} L ${points[0]!.x},${height - pad} Z`

  return (
    <svg width={width} height={height} className="inline-block">
      {showArea && (
        <path d={areaPath} fill={color} opacity={0.1} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1]!.x}
        cy={points[points.length - 1]!.y}
        r={2.5}
        fill={color}
      />
    </svg>
  )
}
