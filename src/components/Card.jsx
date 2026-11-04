import { Link } from 'react-router'
import '../styles/items.css'

export default function Card({ item, to, selected = false, disabled = false, onClick }) {
  return (
    <article className={`item-card${selected ? ' selected' : ''}`}>
      <Link
        className="item-card-link"
        to={to}
        aria-current={selected ? 'page' : undefined}
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) event.preventDefault()
          else onClick?.(event)
        }}
      >
        <span className="item-avatar" aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span>
        <span className="item-card-copy"><strong>{item.name}</strong><span>{item.description}</span></span>
        <span className="item-card-details">
          <span className="card-category">{item.category ?? 'General'}</span>
          <span className={`item-status ${item.status === 'Completed' ? 'is-complete' : ''}`}>{item.status ?? 'Planned'}</span>
          <span className="card-priority">{item.priority ?? 'Normal'} priority</span>
          <span className="card-id">#{item.id}</span>
          <span className="row-arrow" aria-hidden="true">↗</span>
        </span>
      </Link>
    </article>
  )
}
