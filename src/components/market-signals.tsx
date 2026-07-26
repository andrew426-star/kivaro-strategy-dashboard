"use client"

import { useEffect, useState } from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MarketSignal } from "@/lib/data/portfolio"

// Small client-side random-walk jitter so the watchlist feels alive during
// a live demo — purely cosmetic, not a real feed. Ticks every few seconds.
function jitter(signals: MarketSignal[]): MarketSignal[] {
  return signals.map((s) => {
    const wiggle = (Math.random() - 0.5) * Math.abs(s.price) * 0.0008
    const price = s.price + wiggle
    const change = s.change + wiggle
    const changePercent = (change / (price - change)) * 100
    return { ...s, price, change, changePercent }
  })
}

export function MarketSignals({ initial }: { initial: MarketSignal[] }) {
  const [signals, setSignals] = useState(initial)

  useEffect(() => {
    const interval = setInterval(() => {
      setSignals((prev) => jitter(prev))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="glow-border">
      <CardHeader>
        <CardTitle>Market Signals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {signals.map((s) => {
            const up = s.change >= 0
            return (
              <div
                key={s.symbol}
                className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5"
              >
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className="font-heading text-base text-foreground">
                  {s.price >= 1000 ? s.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : s.price.toFixed(2)}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs ${up ? "text-primary" : "text-destructive"}`}
                >
                  {up ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
                  {s.changePercent.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
