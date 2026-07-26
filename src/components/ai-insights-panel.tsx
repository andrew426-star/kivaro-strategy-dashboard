"use client"

import { useEffect, useState } from "react"
import { Loader2Icon, RefreshCwIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type InsightsState =
  | { status: "loading" }
  | { status: "ready"; text: string; generatedAt: number }
  | { status: "error"; message: string }

export function AiInsightsPanel() {
  const [state, setState] = useState<InsightsState>({ status: "loading" })

  async function loadInsights() {
    setState({ status: "loading" })
    try {
      const res = await fetch("/api/insights", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate insights.")
      setState({ status: "ready", text: data.text, generatedAt: data.generatedAt })
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to generate insights.",
      })
    }
  }

  useEffect(() => {
    loadInsights()
  }, [])

  return (
    <Card className="glow-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <SparklesIcon className="size-4 text-primary" />
          AI-Generated Insights
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={loadInsights}
          disabled={state.status === "loading"}
          aria-label="Regenerate insights"
        >
          <RefreshCwIcon className={state.status === "loading" ? "animate-spin" : ""} />
        </Button>
      </CardHeader>
      <CardContent>
        {state.status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Generating a real-time strategy brief...
          </div>
        )}
        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
        {state.status === "ready" && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{state.text}</p>
        )}
      </CardContent>
    </Card>
  )
}
