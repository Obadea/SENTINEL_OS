"use client"
import { Gauge } from "@/components/gauge"

interface SecurityPulseChartProps {
  value?: number;
}

export function SecurityPulseChart({ value = 74 }: SecurityPulseChartProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Gauge
        value={value}
        label="Security Pulse"
        primary={{
          0: "#a1d800",
          70: "#ff4d4d"
        }}
        showPercentage
      />
    </div>
  )
}
