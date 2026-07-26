// Fully synthetic — no real client, no real capital, no live API calls in
// this data layer. Deliberately deterministic (not Math.random()) so the
// portfolio reads as one consistent illustrative fund across reloads and
// deployments, rather than reshuffling every time the page loads.

export interface Holding {
  symbol: string
  name: string
  assetClass: "Equities" | "Fixed Income" | "Alternatives" | "Digital Assets" | "Cash"
  quantity: number
  costBasis: number
  currentPrice: number
  marketValue: number
  unrealizedPL: number
  unrealizedPLPercent: number
  weight: number
}

export interface AllocationSlice {
  assetClass: string
  value: number
  percent: number
}

export interface PortfolioSnapshot {
  fundName: string
  asOf: string
  totalValue: number
  totalUnrealizedPL: number
  totalUnrealizedPLPercent: number
  holdings: Holding[]
  performanceHistory: { date: string; value: number }[]
  allocation: AllocationSlice[]
}

export interface MarketSignal {
  symbol: string
  label: string
  price: number
  change: number
  changePercent: number
}

// A small deterministic LCG — reproducible "randomness" so the performance
// curve looks organic without actually being random each build/reload.
function createSeededRandom(seed: number) {
  let state = seed
  return function random() {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

interface RawHolding {
  symbol: string
  name: string
  assetClass: Holding["assetClass"]
  currentPrice: number
  marketValue: number
  unrealizedPLPercent: number
}

const RAW_HOLDINGS: RawHolding[] = [
  // Equities — ~50%
  { symbol: "AAPL", name: "Apple Inc.", assetClass: "Equities", currentPrice: 327.40, marketValue: 16_800_000, unrealizedPLPercent: 18.4 },
  { symbol: "MSFT", name: "Microsoft Corp.", assetClass: "Equities", currentPrice: 512.15, marketValue: 16_200_000, unrealizedPLPercent: 22.1 },
  { symbol: "NVDA", name: "NVIDIA Corp.", assetClass: "Equities", currentPrice: 208.90, marketValue: 15_400_000, unrealizedPLPercent: 41.7 },
  { symbol: "GOOGL", name: "Alphabet Inc.", assetClass: "Equities", currentPrice: 214.60, marketValue: 12_600_000, unrealizedPLPercent: 15.2 },
  { symbol: "AMZN", name: "Amazon.com Inc.", assetClass: "Equities", currentPrice: 246.85, marketValue: 12_100_000, unrealizedPLPercent: 9.8 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", assetClass: "Equities", currentPrice: 289.30, marketValue: 11_500_000, unrealizedPLPercent: 12.6 },
  { symbol: "UNH", name: "UnitedHealth Group", assetClass: "Equities", currentPrice: 372.10, marketValue: 9_800_000, unrealizedPLPercent: -8.3 },
  { symbol: "V", name: "Visa Inc.", assetClass: "Equities", currentPrice: 361.75, marketValue: 9_200_000, unrealizedPLPercent: 14.9 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", assetClass: "Equities", currentPrice: 128.40, marketValue: 8_600_000, unrealizedPLPercent: 3.1 },
  { symbol: "COST", name: "Costco Wholesale", assetClass: "Equities", currentPrice: 998.20, marketValue: 8_100_000, unrealizedPLPercent: 19.5 },

  // Fixed Income — ~25%
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", assetClass: "Fixed Income", currentPrice: 92.15, marketValue: 18_400_000, unrealizedPLPercent: -2.4 },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", assetClass: "Fixed Income", currentPrice: 98.60, marketValue: 16_900_000, unrealizedPLPercent: 1.2 },
  { symbol: "LQD", name: "iShares iBoxx Investment Grade Corp Bond ETF", assetClass: "Fixed Income", currentPrice: 109.40, marketValue: 14_200_000, unrealizedPLPercent: 3.7 },
  { symbol: "MUB", name: "iShares National Muni Bond ETF", assetClass: "Fixed Income", currentPrice: 106.85, marketValue: 12_800_000, unrealizedPLPercent: 0.9 },

  // Alternatives — ~15%
  { symbol: "GLD", name: "SPDR Gold Shares", assetClass: "Alternatives", currentPrice: 268.30, marketValue: 15_600_000, unrealizedPLPercent: 27.3 },
  { symbol: "VNQ", name: "Vanguard Real Estate ETF", assetClass: "Alternatives", currentPrice: 91.75, marketValue: 12_100_000, unrealizedPLPercent: -4.6 },
  { symbol: "DBC", name: "Invesco DB Commodity Index Tracking Fund", assetClass: "Alternatives", currentPrice: 23.90, marketValue: 8_900_000, unrealizedPLPercent: 6.8 },

  // Digital Assets — ~5%
  { symbol: "BTC", name: "Bitcoin (spot-equivalent exposure)", assetClass: "Digital Assets", currentPrice: 64_180, marketValue: 8_200_000, unrealizedPLPercent: 34.9 },
  { symbol: "ETH", name: "Ethereum (spot-equivalent exposure)", assetClass: "Digital Assets", currentPrice: 1_872, marketValue: 3_600_000, unrealizedPLPercent: -11.2 },

  // Cash — ~5%
  { symbol: "CASH", name: "Cash & Equivalents", assetClass: "Cash", currentPrice: 1, marketValue: 12_400_000, unrealizedPLPercent: 0 },
]

function buildHoldings(): { holdings: Holding[]; totalValue: number } {
  const totalValue = RAW_HOLDINGS.reduce((sum, h) => sum + h.marketValue, 0)
  const holdings: Holding[] = RAW_HOLDINGS.map((h) => {
    const unrealizedPL = h.marketValue * (h.unrealizedPLPercent / 100)
    const costBasis = h.marketValue - unrealizedPL
    return {
      symbol: h.symbol,
      name: h.name,
      assetClass: h.assetClass,
      quantity: h.symbol === "CASH" ? h.marketValue : h.marketValue / h.currentPrice,
      costBasis,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      unrealizedPL,
      unrealizedPLPercent: h.unrealizedPLPercent,
      weight: (h.marketValue / totalValue) * 100,
    }
  })
  return { holdings, totalValue }
}

function buildAllocation(holdings: Holding[], totalValue: number): AllocationSlice[] {
  const byClass = new Map<string, number>()
  for (const h of holdings) {
    byClass.set(h.assetClass, (byClass.get(h.assetClass) ?? 0) + h.marketValue)
  }
  return Array.from(byClass.entries()).map(([assetClass, value]) => ({
    assetClass,
    value,
    percent: (value / totalValue) * 100,
  }))
}

function buildPerformanceHistory(totalValue: number, days: number): { date: string; value: number }[] {
  const random = createSeededRandom(42)
  const history: { date: string; value: number }[] = []
  // Walk backward from today's total so the series ends exactly at the
  // current portfolio value, with a mild upward drift over the period.
  let value = totalValue
  const values: number[] = [value]
  for (let i = 1; i < days; i++) {
    const drift = 0.0006
    const noise = (random() - 0.5) * 0.014
    value = value / (1 + drift + noise)
    values.unshift(value)
  }
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - (days - 1 - i))
    history.push({ date: date.toISOString().slice(0, 10), value: Math.round(values[i]) })
  }
  return history
}

export function getPortfolioSnapshot(): PortfolioSnapshot {
  const { holdings, totalValue } = buildHoldings()
  const totalUnrealizedPL = holdings.reduce((sum, h) => sum + h.unrealizedPL, 0)
  const totalCostBasis = totalValue - totalUnrealizedPL
  return {
    fundName: "Meridian Capital Partners — Illustrative Portfolio",
    asOf: new Date().toISOString(),
    totalValue,
    totalUnrealizedPL,
    totalUnrealizedPLPercent: (totalUnrealizedPL / totalCostBasis) * 100,
    holdings: holdings.sort((a, b) => b.marketValue - a.marketValue),
    performanceHistory: buildPerformanceHistory(totalValue, 180),
    allocation: buildAllocation(holdings, totalValue).sort((a, b) => b.value - a.value),
  }
}

const WATCHLIST_BASE: MarketSignal[] = [
  { symbol: "SPY", label: "S&P 500", price: 743.10, change: 4.90, changePercent: 0.66 },
  { symbol: "QQQ", label: "Nasdaq 100", price: 689.55, change: -2.35, changePercent: -0.34 },
  { symbol: "TNX", label: "10Y Treasury Yield", price: 4.18, change: 0.03, changePercent: 0.72 },
  { symbol: "DXY", label: "Dollar Index", price: 103.42, change: -0.21, changePercent: -0.2 },
  { symbol: "VIX", label: "Volatility Index", price: 14.85, change: -0.42, changePercent: -2.75 },
  { symbol: "BTC", label: "Bitcoin", price: 64_180, change: -820, changePercent: -1.26 },
  { symbol: "WTI", label: "Crude Oil (WTI)", price: 71.30, change: 0.85, changePercent: 1.21 },
  { symbol: "GLD", label: "Gold", price: 268.30, change: 1.90, changePercent: 0.71 },
]

// A fresh baseline snapshot for the watchlist — the client applies its own
// small jitter on an interval so the numbers feel alive without pretending
// to be a real live feed.
export function getMarketSignals(): MarketSignal[] {
  return WATCHLIST_BASE.map((s) => ({ ...s }))
}
