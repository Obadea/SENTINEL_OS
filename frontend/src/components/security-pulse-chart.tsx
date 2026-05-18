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
          40: "#a1d800",
          0: "#a1d800",
          1: "#ff4d4d",
          30: "#ff4d4d"
        }}
        showPercentage
      />
    </div>
  )
}
