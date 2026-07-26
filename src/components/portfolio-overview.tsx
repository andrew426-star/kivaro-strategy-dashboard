"use client"

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PortfolioSnapshot } from "@/lib/data/portfolio"

const ALLOCATION_COLORS = [
  "hsl(152 76% 46%)",
  "hsl(162 72% 55%)",
  "hsl(82 80% 55%)",
  "hsl(160 80% 42%)",
  "hsl(155 50% 15%)",
]

const currency = (value: number) =>
  value >= 1_000_000
    ? `$${(value / 1_000_000).toFixed(1)}M`
    : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export function PortfolioOverview({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const up = snapshot.totalUnrealizedPLPercent >= 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="glow-border">
          <CardHeader>
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-heading text-2xl text-foreground">{currency(snapshot.totalValue)}</span>
          </CardContent>
        </Card>
        <Card className="glow-border">
          <CardHeader>
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Unrealized P/L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`font-heading text-2xl ${up ? "text-primary" : "text-destructive"}`}>
              {up ? "+" : ""}
              {currency(snapshot.totalUnrealizedPL)}
            </span>
          </CardContent>
        </Card>
        <Card className="glow-border">
          <CardHeader>
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Overall Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`flex items-center gap-1.5 font-heading text-2xl ${up ? "text-primary" : "text-destructive"}`}
            >
              {up ? <TrendingUpIcon className="size-5" /> : <TrendingDownIcon className="size-5" />}
              {up ? "+" : ""}
              {snapshot.totalUnrealizedPLPercent.toFixed(1)}%
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glow-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance — 180 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={snapshot.performanceHistory}>
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152 76% 46%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(152 76% 46%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 12% 14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(140 10% 55%)" }} minTickGap={40} />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(140 10% 55%)" }}
                  width={60}
                  tickFormatter={(v: number) => currency(v)}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value) => currency(Number(value))}
                  contentStyle={{
                    background: "hsl(150 15% 7%)",
                    border: "1px solid hsl(150 12% 14%)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(152 76% 46%)"
                  fill="url(#perfGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glow-border">
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={snapshot.allocation}
                  dataKey="value"
                  nameKey="assetClass"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {snapshot.allocation.map((slice, i) => (
                    <Cell key={slice.assetClass} fill={ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => currency(Number(value))}
                  contentStyle={{
                    background: "hsl(150 15% 7%)",
                    border: "1px solid hsl(150 12% 14%)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-col gap-1">
              {snapshot.allocation.map((slice, i) => (
                <div key={slice.assetClass} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
                    />
                    {slice.assetClass}
                  </span>
                  <span className="text-foreground">{slice.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glow-border">
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Asset Class</th>
                  <th className="pb-2 text-right font-medium">Market Value</th>
                  <th className="pb-2 text-right font-medium">Weight</th>
                  <th className="pb-2 text-right font-medium">P/L</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.holdings.map((h) => {
                  const positive = h.unrealizedPLPercent >= 0
                  return (
                    <tr key={h.symbol} className="border-b border-border/60 last:border-0">
                      <td className="py-2">
                        <div className="font-heading text-sm text-foreground">{h.symbol}</div>
                        <div className="text-xs text-muted-foreground">{h.name}</div>
                      </td>
                      <td className="py-2 text-muted-foreground">{h.assetClass}</td>
                      <td className="py-2 text-right text-foreground">{currency(h.marketValue)}</td>
                      <td className="py-2 text-right text-muted-foreground">{h.weight.toFixed(1)}%</td>
                      <td className={`py-2 text-right ${positive ? "text-primary" : "text-destructive"}`}>
                        {positive ? "+" : ""}
                        {h.unrealizedPLPercent.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
