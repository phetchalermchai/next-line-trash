import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface SummaryCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  iconColor?: string
}

export default function SummaryCard({ icon: Icon, label, value, iconColor }: SummaryCardProps) {
  return (
    <Card className="@container/card transition-colors">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-accent ${iconColor ?? "text-primary"}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-xl font-bold text-foreground leading-tight">{value}</span>
        </div>
      </CardContent>
    </Card>
  )
}