import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router'
import LoadingState from '../components/LoadingState.jsx'
import Card from '../components/Card.jsx'
import ItemFilters from '../components/ItemFilters.jsx'
import useItemQuery from '../hooks/useItemQuery.js'
import useItems from '../hooks/useItems.js'

export default function ItemsPage() {
  const { query, queryString, changeQuery } = useItemQuery()
  const { result, status, error, reload } = useItems(queryString)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const selected = useMatch('/items/:id')?.params.id ?? null
  const { search } = useLocation()
  const navigate = useNavigate()
  const hasFilters = Boolean(query.search || query.category || query.status || query.priority)

  function clearFilters() {
    changeQuery({ search: '', category: '', status: '', priority: '', page: 1 })
  }

  useEffect(() => {
    if (status === 'success' && query.page > Math.max(1, result.totalPages)) {
      changeQuery({ page: Math.max(1, result.totalPages) }, { replace: true })
    }
  }, [status, query.page, result.totalPages, changeQuery])

  function closeEditor() {
    navigate({ pathname: '/items', search })
  }

  function onSaved(message) {
    setBusy(false)
    setNotice(message)
    closeEditor()
    reload()
  }

  function onCompleted(updated) {
    setNotice(`Item #${updated.id} marked complete.`)
    reload()
  }

  function openItem(event) {
    if (busy) event.preventDefault()
    else setNotice('')
  }

  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Your collection, organized</p><h1>All the little details.</h1><p className="intro">Keep your items in one place. Find, refine, and make room for more.</p></div>
        <Link className="button primary" to={{ pathname: '/items/new', search }} aria-disabled={busy} onClick={openItem}><span aria-hidden="true">＋</span> New item</Link>
      </div>
      {notice && <div className="notice" role="status"><span>✓ {notice}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
      <div className={`workspace ${selected !== null ? 'with-editor' : ''}`}>
        <section className="collection panel" aria-labelledby="collection-title">
          <div className="section-heading"><div className="collection-title"><h2 id="collection-title">Your items</h2>{status === 'success' && <span className="count">{result.total}</span>}</div><button className="quiet" disabled={status === 'loading' || busy} onClick={reload}>↻ Reload</button></div>
          <div className="toolbar">
            <label className="search"><span className="sr-only">Search items</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Search names or descriptions…" value={query.search} onChange={(event) => changeQuery({ search: event.target.value, page: 1 }, { replace: true })} /></label>
            <label className="sort"><span className="sr-only">Sort items</span><select value={query.sort} onChange={(event) => changeQuery({ sort: event.target.value, page: 1 })}><option value="name">Name: A–Z</option><option value="name-desc">Name: Z–A</option></select></label>
          </div>
          <ItemFilters query={query} hasFilters={hasFilters} onChange={changeQuery} onClear={clearFilters} />
          <div className="items" aria-busy={status === 'loading'}>
            {status === 'loading' ? <LoadingState>Loading your items…</LoadingState> : status === 'error' ? <div className="state"><span className="state-symbol">!</span><h3>We couldn’t load your items</h3><p role="alert">{error}</p><button onClick={reload}>Try again</button></div> : result.data.length === 0 ? <div className="state"><span className="state-symbol">◇</span><h3>{hasFilters ? 'No matching items' : 'A fresh start'}</h3><p>{hasFilters ? 'Try changing your search or filters.' : 'Create your first item to start your collection.'}</p>{hasFilters ? <button onClick={clearFilters}>Show all items</button> : <Link className="button" to={{ pathname: '/items/new', search }} aria-disabled={busy} onClick={openItem}>Create an item</Link>}</div> : (
              <ul className="card-grid">{result.data.map((item) => (
                <li key={item.id}>
                  <Card item={item} to={{ pathname: `/items/${item.id}`, search }} selected={selected === String(item.id)} disabled={busy} onClick={openItem} />
                </li>
              ))}</ul>
            )}
          </div>
          <footer className="pagination"><label>Rows per page <select value={query.limit} onChange={(event) => changeQuery({ limit: Number(event.target.value), page: 1 })}><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label><div className="page-controls"><span>{status === 'success' ? `Page ${query.page} of ${Math.max(1, result.totalPages)}` : '—'}</span><button aria-label="Previous page" disabled={status !== 'success' || query.page <= 1} onClick={() => changeQuery({ page: query.page - 1 })}>←</button><button aria-label="Next page" disabled={status !== 'success' || query.page >= result.totalPages} onClick={() => changeQuery({ page: query.page + 1 })}>→</button></div></footer>
        </section>
        <Suspense key={selected ?? 'list'} fallback={<section className="editor panel" aria-label="Loading item details"><LoadingState>Loading item page…</LoadingState></section>}>
          <Outlet context={{ busy, setBusy, closeEditor, onSaved, onCompleted }} />
        </Suspense>
      </div>
    </>
  )
}
