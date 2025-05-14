"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef } from "react"

interface ProjectBudgetChartProps {
  budget: number
  actualCost: number
}

export function ProjectBudgetChart({ budget, actualCost }: ProjectBudgetChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Calculate percentage
    const percentage = Math.min(actualCost / budget, 1)
    const remaining = 1 - percentage

    // Draw background circle (remaining budget)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = "#e2e8f0" // Tailwind slate-200
    ctx.fill()

    // Draw actual cost arc
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, (2 * percentage - 0.5) * Math.PI)
    ctx.closePath()
    ctx.fillStyle = percentage > 1 ? "#ef4444" : "#3b82f6" // Red if over budget, blue otherwise
    ctx.fill()

    // Draw inner circle (for donut effect)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()

    // Add text in center
    ctx.fillStyle = "#1e293b" // Tailwind slate-800
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${Math.round(percentage * 100)}%`, centerX, centerY - 10)

    ctx.font = "12px sans-serif"
    ctx.fillText("of budget used", centerX, centerY + 10)
  }, [budget, actualCost])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Utilization</CardTitle>
        <CardDescription>Current spending vs. total budget</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="relative">
          <canvas ref={canvasRef} width={200} height={200} />
          <div className="absolute bottom-0 w-full text-center text-sm text-muted-foreground">
            ${actualCost.toLocaleString()} of ${budget.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
