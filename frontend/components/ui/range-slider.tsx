"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onRelease: (value: [number, number]) => void
  className?: string
  formatLabel?: (value: number) => string
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onRelease,
  className,
  formatLabel = (v) => String(v),
}: RangeSliderProps) {
  const [dragValue, setDragValue] = useState<[number, number]>(value)
  const isDragging = useRef(false)
  const prevValue = useRef(value)

  const displayValue = isDragging.current ? dragValue : value

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      isDragging.current = true
      const newMin = Math.min(Number(e.target.value), displayValue[1] - step)
      setDragValue([newMin, displayValue[1]])
    },
    [displayValue, step],
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      isDragging.current = true
      const newMax = Math.max(Number(e.target.value), displayValue[0] + step)
      setDragValue([displayValue[0], newMax])
    },
    [displayValue, step],
  )

  const handleRelease = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      const final = dragValue
      prevValue.current = final
      onRelease(final)
    }
  }, [dragValue, onRelease])

  const [minVal, maxVal] = displayValue
  const range = max - min || 1
  const leftPercent = ((minVal - min) / range) * 100
  const rightPercent = ((maxVal - min) / range) * 100

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{formatLabel(minVal)}</span>
        <span>{formatLabel(maxVal)}</span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-muted" />
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="absolute top-0 left-0 z-30 h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm"
          style={{ width: `${rightPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="absolute top-0 h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm"
          style={{ width: `${100 - leftPercent}%`, left: `${leftPercent}%` }}
        />
      </div>
    </div>
  )
}
