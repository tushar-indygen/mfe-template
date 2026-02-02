import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "crm-base-ui"

interface StatItem {
  label: string
  value: number
}

interface ZoneStatsProps {
  stats: StatItem[]
}

export function ZoneStats({ stats }: ZoneStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="rounded-xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {s.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
