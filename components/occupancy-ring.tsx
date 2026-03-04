"use client"

interface OccupancyRingProps {
  current: number
  max: number
  size?: number
}

export function OccupancyRing({ current, max, size = 160 }: OccupancyRingProps) {
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(current / max, 1)
  const offset = circumference - percentage * circumference
  const isHigh = percentage >= 0.8
  const isMedium = percentage >= 0.5 && percentage < 0.8

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={
            isHigh
              ? "text-destructive transition-all duration-700"
              : isMedium
              ? "text-accent transition-all duration-700"
              : "text-primary transition-all duration-700"
          }
          stroke="currentColor"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-bold text-foreground">
          {current}
        </span>
        <span className="text-xs text-muted-foreground">/ {max} personas</span>
      </div>
    </div>
  )
}
