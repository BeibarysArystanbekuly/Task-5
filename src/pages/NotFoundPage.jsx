import { Link } from 'react-router'

export default function NotFoundPage({ item = false }) {
  return (
    <section className={`panel state${item ? ' editor' : ''}`} aria-labelledby="not-found-title">
      <p className="eyebrow">{item ? '404 · Item not found' : '404 · Page not found'}</p>
      <h1 id="not-found-title">{item ? 'Item not found' : 'Nothing here just yet.'}</h1>
      <p>{item ? 'This item link is invalid. Open your collection to choose an item.' : 'The page you’re looking for does not exist.'}</p>
      <div className="form-actions">
        <Link className="button primary" to="/">Back to home</Link>
        {item && <Link className="button" to="/items">All Items</Link>}
      </div>
    </section>
  )
}
