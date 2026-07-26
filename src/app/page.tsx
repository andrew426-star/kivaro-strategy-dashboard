import { AiInsightsPanel } from "@/components/ai-insights-panel"
import { MarketSignals } from "@/components/market-signals"
import { PortfolioOverview } from "@/components/portfolio-overview"
import { SampleDataBanner } from "@/components/sample-data-banner"
import { getMarketSignals, getPortfolioSnapshot } from "@/lib/data/portfolio"

export default function Home() {
  const snapshot = getPortfolioSnapshot()
  const signals = getMarketSignals()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
      <SampleDataBanner />

      <header className="flex flex-col gap-1 py-2">
        <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Strategy Intelligence Dashboard
        </span>
        <h1 className="font-heading text-2xl text-gradient-green sm:text-3xl">{snapshot.fundName}</h1>
      </header>

      <PortfolioOverview snapshot={snapshot} />
      <MarketSignals initial={signals} />
      <AiInsightsPanel />
    </div>
  )
}
