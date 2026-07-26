import { NextResponse } from "next/server"

import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini-client"
import { getMarketSignals, getPortfolioSnapshot } from "@/lib/data/portfolio"

// Bounds cost on a page that may sit open through an entire live pitch —
// regenerated on a fixed interval server-side, not once per page load.
const CACHE_TTL_MS = 10 * 60 * 1000

let cache: { text: string; generatedAt: number } | null = null

function buildPrompt(): string {
  const portfolio = getPortfolioSnapshot()
  const signals = getMarketSignals()

  const holdingsSummary = portfolio.holdings
    .map(
      (h) =>
        `${h.symbol} (${h.assetClass}): $${Math.round(h.marketValue).toLocaleString()} market value, ${h.weight.toFixed(1)}% of portfolio, ${h.unrealizedPLPercent >= 0 ? "+" : ""}${h.unrealizedPLPercent.toFixed(1)}% unrealized`
    )
    .join("\n")

  const allocationSummary = portfolio.allocation
    .map((a) => `${a.assetClass}: ${a.percent.toFixed(1)}%`)
    .join(", ")

  const signalsSummary = signals
    .map(
      (s) =>
        `${s.label} (${s.symbol}): ${s.price} (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`
    )
    .join("\n")

  return `You are a senior portfolio strategist producing a brief for an institutional client's dashboard. Analyze the following ILLUSTRATIVE portfolio (this is sample/demo data, not a real fund) and current market signals, then write a tight, professional brief.

PORTFOLIO: ${portfolio.fundName}
Total value: $${Math.round(portfolio.totalValue).toLocaleString()}
Overall P/L: ${portfolio.totalUnrealizedPLPercent >= 0 ? "+" : ""}${portfolio.totalUnrealizedPLPercent.toFixed(1)}%
Allocation: ${allocationSummary}

HOLDINGS:
${holdingsSummary}

CURRENT MARKET SIGNALS:
${signalsSummary}

Write 3-4 short paragraphs covering: (1) the most notable risk or concentration in this portfolio, (2) a correlation or exposure worth flagging given current market signals, (3) one concrete rebalancing or hedging observation. Be specific and cite the actual numbers above. Do not add a preamble or disclaimer — start directly with the analysis. Keep it under 200 words.

Output plain prose only — no markdown formatting of any kind (no **bold**, no #headers, no bullet lists, no asterisks). This renders directly as plain text, so any markdown syntax will show up as literal characters on the page.`
}

export async function POST() {
  const now = Date.now()
  if (cache && now - cache.generatedAt < CACHE_TTL_MS) {
    return NextResponse.json({ text: cache.text, generatedAt: cache.generatedAt, cached: true })
  }

  try {
    const client = getGeminiClient()
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(),
    })
    const text = (response.text ?? "").trim()
    if (!text) throw new Error("Gemini returned an empty response.")

    cache = { text, generatedAt: now }
    return NextResponse.json({ text, generatedAt: now, cached: false })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate insights." },
      { status: 502 }
    )
  }
}
