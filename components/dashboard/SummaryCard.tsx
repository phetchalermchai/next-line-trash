interface SummaryCardProps {
  icon: string
  label: string
  value: string | number
}

export default function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  )
}