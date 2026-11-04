import { useId } from 'react'
import { Link } from 'react-router'

export default function DataBreakdown({ title, entries, total, getLink }) {
  const headingId = useId()
  return (
    <section className="panel dashboard-breakdown" aria-labelledby={headingId}>
      <div className="section-heading"><h2 id={headingId}>{title}</h2><span className="count">{total} items</span></div>
      {entries.length ? <ul className="breakdown-list">{entries.map(({ name, count }) => (
        <li key={name}>
          <Link to={getLink(name)}>
            <span className="breakdown-label"><strong>{name}</strong><span>{count} <span className="breakdown-percent">({Math.round(count / total * 100)}%)</span></span></span>
            <span className="breakdown-track" aria-hidden="true"><span style={{ width: `${count / total * 100}%` }} /></span>
          </Link>
        </li>
      ))}</ul> : <p className="dashboard-muted">No items in this selection.</p>}
    </section>
  )
}
