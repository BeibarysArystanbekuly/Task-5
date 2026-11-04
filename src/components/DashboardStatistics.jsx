export default function DashboardStatistics({ statistics }) {
  const values = [
    { label: 'Total items', value: statistics.total, hint: 'In this selection' },
    { label: 'Completed', value: statistics.completed, hint: 'Marked complete' },
    { label: 'In progress', value: statistics.inProgress, hint: 'Currently underway' },
    { label: 'High or urgent priority', value: statistics.highPriority, hint: 'Across selected statuses' },
    { label: 'Completion rate', value: `${statistics.completionRate}%`, hint: 'Completed ÷ total items' },
  ]

  return (
    <dl className="dashboard-statistics" aria-label="Collection statistics">
      {values.map(({ label, value, hint }) => (
        <div key={label} className="panel statistic-card" role="group" aria-label={label}>
          <dt>{label}</dt><dd className="statistic-value">{value}</dd><dd className="statistic-hint">{hint}</dd>
        </div>
      ))}
    </dl>
  )
}
