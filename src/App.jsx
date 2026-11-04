import { useEffect, useState } from 'react'
import { createItem, deleteItem, getItem, getItemsList, updateItem } from './api/fakeApi'
import './App.css'

function ItemEditor({ id, onClose, onSaved, onBusy, onCompleted }) {
  const [item, setItem] = useState({
    name: '', description: '', category: 'General', status: 'Planned',
    priority: 'Normal', owner: '', dueDate: '',
  })
  const [status, setStatus] = useState(id === 'new' ? 'ready' : 'loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [operation, setOperation] = useState(null)
  const [savedStatus, setSavedStatus] = useState('')

  useEffect(() => {
    if (id === 'new') return
    let ignore = false
    async function load() {
      try {
        const result = await getItem(id)
        if (!ignore) {
          // Older records may not have the extended fields yet.
          setItem({ category: 'General', status: 'Planned', priority: 'Normal', owner: '', dueDate: '', ...result })
          setSavedStatus(result.status ?? 'Planned')
          setStatus('ready')
        }
      } catch (err) {
        if (!ignore) { setError(err.message); setStatus('error') }
      }
    }
    load()
    return () => { ignore = true }
  }, [id, attempt])

  useEffect(() => {
    if (!operation) return
    let ignore = false
    async function save() {
      let createdId = null
      try {
        let updatedItem = null
        if (operation.action === 'delete') await deleteItem(operation.id)
        else if (operation.action === 'complete') {
          updatedItem = await updateItem(operation.id, { status: 'Completed' })
        }
        else {
          let targetId = operation.id
          if (targetId === 'new') {
            // createItem accepts only name and description. Persist extra
            // fields with the supplied update API, leaving it unchanged.
            const created = await createItem(operation.values)
            createdId = created.id
            targetId = created.id
            if (!ignore) setItem((previous) => ({ ...previous, id: created.id }))
          }
          await updateItem(targetId, operation.values)
        }
        if (!ignore) {
          operation.onBusy(false)
          if (operation.action === 'complete') {
            // Apply only the returned status so unsaved edits stay in the form.
            setItem((previous) => previous.id === updatedItem.id ? { ...previous, status: updatedItem.status } : previous)
            setSavedStatus(updatedItem.status)
            operation.onCompleted(updatedItem)
          } else {
            operation.onSaved(operation.action === 'delete' ? 'Item deleted.' : operation.id === 'new' ? 'Item created.' : 'Changes saved.')
          }
          setOperation(null)
        }
      } catch (err) {
        if (!ignore) {
          setError(createdId === null ? err.message : `Item #${createdId} was created, but its extra details could not be saved: ${err.message}. Save again to complete this item.`)
          setStatus('ready')
          setOperation(null)
          operation.onBusy(false)
        }
      }
    }
    save()
    return () => { ignore = true }
  }, [operation])

  function mutate(action) {
    if (operation || status !== 'ready') return
    const values = { ...item, name: item.name.trim(), description: item.description.trim(), owner: item.owner.trim() }
    if (action === 'save' && (!values.name || !values.description)) {
      setError('Enter a name and description.')
      return
    }
    setError('')
    onBusy(true)
    // Capture this submission so parent renders cannot restart the request.
    setOperation({ action, id: item.id ?? id, values, onBusy, onSaved, onCompleted })
  }

  const saving = operation !== null
  return (
    <section className="editor panel" aria-labelledby="editor-title" aria-busy={status === 'loading' || saving}>
      <div className="section-heading">
        <div><p className="eyebrow">{item.id ? `Item #${item.id}` : id === 'new' ? 'A fresh entry' : `Item #${id}`}</p><h2 id="editor-title">{id === 'new' && !item.id ? 'Create an item' : 'Item details'}</h2></div>
        <button className="icon-button" onClick={onClose} disabled={saving} aria-label="Close item details">×</button>
      </div>
      {status === 'loading' ? <p className="state" role="status">Loading item…</p> : status === 'error' ? (
        <div className="state"><p role="alert">{error}</p><button onClick={() => { setStatus('loading'); setError(''); setAttempt(attempt + 1) }}>Try again</button></div>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); mutate('save') }}>
          <fieldset disabled={saving}>
            <label htmlFor="item-name">Name</label>
            <input autoFocus id="item-name" value={item.name} onChange={(event) => setItem({ ...item, name: event.target.value })} required maxLength={160} placeholder="Give your item a name" />
            <label htmlFor="item-description">Description</label>
            <textarea id="item-description" value={item.description} onChange={(event) => setItem({ ...item, description: event.target.value })} required maxLength={2000} rows={7} placeholder="Add a little detail…" />
            <div className="detail-fields">
              <div>
                <label htmlFor="item-category">Category</label>
                <select id="item-category" value={item.category} onChange={(event) => setItem({ ...item, category: event.target.value })}>
                  <option>General</option><option>Operations</option><option>Support</option><option>Research</option><option>Equipment</option>
                </select>
              </div>
              <div>
                <label htmlFor="item-status">Status</label>
                <select id="item-status" value={item.status} onChange={(event) => setItem({ ...item, status: event.target.value })}>
                  <option>Planned</option><option>In progress</option><option>Completed</option><option>On hold</option>
                </select>
              </div>
              <div>
                <label htmlFor="item-priority">Priority</label>
                <select id="item-priority" value={item.priority} onChange={(event) => setItem({ ...item, priority: event.target.value })}>
                  <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="item-owner">Owner</label>
                <input id="item-owner" value={item.owner} onChange={(event) => setItem({ ...item, owner: event.target.value })} maxLength={120} placeholder="Unassigned" />
              </div>
              <div>
                <label htmlFor="item-due-date">Due date</label>
                <input id="item-due-date" type="date" value={item.dueDate} onChange={(event) => setItem({ ...item, dueDate: event.target.value })} />
              </div>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            {(id !== 'new' || item.id) && <div className="completion-action">
              <button type="button" onClick={() => mutate('complete')} disabled={savedStatus === 'Completed'}>
                {operation?.action === 'complete' ? 'Completing...' : savedStatus === 'Completed' ? 'Completed' : 'Mark complete'}
              </button>
              <p>Updates the saved status while keeping your other edits.</p>
            </div>}
            <div className="form-actions"><button className="primary" type="submit">{saving ? 'Working…' : id === 'new' ? 'Create item' : 'Save changes'}</button><button type="button" onClick={onClose}>Cancel</button></div>
            {(id !== 'new' || item.id) && <div className="delete-area">{confirmDelete ? <><p>Delete this item? This cannot be undone.</p><div className="form-actions"><button type="button" className="danger" onClick={() => mutate('delete')}>Yes, delete item</button><button type="button" onClick={() => setConfirmDelete(false)}>Keep item</button></div></> : <button type="button" className="text-danger" onClick={() => setConfirmDelete(true)}>Delete item</button>}</div>}
          </fieldset>
        </form>
      )}
    </section>
  )
}

function App() {
  const [query, setQuery] = useState({ search: '', sort: 'name', page: 1, limit: 10 })
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 0 })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // Requests cannot be aborted, so ignore responses from superseded Effects.
    let ignore = false
    async function load() {
      try {
        const data = await getItemsList(`?${new URLSearchParams(query)}`)
        if (ignore) return
        // Deleting the last item on a page may move the last page backward.
        if (query.page > Math.max(1, data.totalPages)) {
          setQuery((previous) => ({ ...previous, page: Math.max(1, data.totalPages) }))
          return
        }
        setResult(data)
        setStatus('success')
      } catch (err) {
        if (!ignore) { setError(err.message); setStatus('error') }
      }
    }
    load()
    return () => { ignore = true }
  }, [query, refresh])

  function changeQuery(changes) {
    setStatus('loading')
    setError('')
    setQuery((previous) => ({ ...previous, ...changes }))
  }

  function reload() {
    setStatus('loading')
    setError('')
    setRefresh((value) => value + 1)
  }

  return (
    <div className="app-shell">
      <header className="topbar"><a className="brand" href="./"><span className="brand-mark">i</span>Itemspace<span className="badge">WORKSPACE</span></a><span className="topbar-note">A little order. A clearer view.</span></header>
      <main>
        <div className="page-heading"><div><p className="eyebrow">Your collection, organized</p><h1>All the little details.</h1><p className="intro">Keep your items in one place. Find, refine, and make room for more.</p></div><button className="primary" disabled={busy} onClick={() => { setSelected('new'); setNotice('') }}><span aria-hidden="true">＋</span> New item</button></div>
        {notice && <div className="notice" role="status"><span>✓ {notice}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
        <div className={`workspace ${selected !== null ? 'with-editor' : ''}`}>
          <section className="collection panel" aria-labelledby="collection-title">
            <div className="section-heading"><div className="collection-title"><h2 id="collection-title">Your items</h2>{status === 'success' && <span className="count">{result.total}</span>}</div><button className="quiet" disabled={status === 'loading' || busy} onClick={reload}>↻ Reload</button></div>
            <div className="toolbar">
              <label className="search"><span className="sr-only">Search items</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Search names or descriptions…" value={query.search} onChange={(event) => changeQuery({ search: event.target.value, page: 1 })} /></label>
              <label className="sort"><span className="sr-only">Sort items</span><select value={query.sort} onChange={(event) => changeQuery({ sort: event.target.value, page: 1 })}><option value="name">Name: A–Z</option><option value="name-desc">Name: Z–A</option></select></label>
            </div>
            <div className="items" aria-busy={status === 'loading'}>
              {status === 'loading' ? <div className="state" role="status"><span className="spinner" />Loading your items…</div> : status === 'error' ? <div className="state"><span className="state-symbol">!</span><h3>We couldn’t load your items</h3><p role="alert">{error}</p><button onClick={reload}>Try again</button></div> : result.data.length === 0 ? <div className="state"><span className="state-symbol">◇</span><h3>{query.search ? 'No matching items' : 'A fresh start'}</h3><p>{query.search ? 'Try a different name or description.' : 'Create your first item to start your collection.'}</p><button disabled={busy} onClick={() => query.search ? changeQuery({ search: '', page: 1 }) : setSelected('new')}>{query.search ? 'Clear search' : 'Create an item'}</button></div> : (
                <ul className="item-list">{result.data.map((item) => <li key={item.id}><button className={`item-row ${selected === item.id ? 'selected' : ''}`} disabled={busy} onClick={() => { setSelected(item.id); setNotice('') }} aria-pressed={selected === item.id}><span className="item-avatar" aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span><span className="item-copy"><strong>{item.name}</strong><span>{item.description}</span></span><span className={`item-status ${item.status === 'Completed' ? 'is-complete' : ''}`}>{item.status ?? 'Planned'}</span><span className="item-id">#{item.id}</span><span className="row-arrow" aria-hidden="true">↗</span></button></li>)}</ul>
              )}
            </div>
            <footer className="pagination"><label>Rows per page <select value={query.limit} onChange={(event) => changeQuery({ limit: Number(event.target.value), page: 1 })}><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label><div className="page-controls"><span>{status === 'success' ? `Page ${query.page} of ${Math.max(1, result.totalPages)}` : '—'}</span><button aria-label="Previous page" disabled={status !== 'success' || query.page <= 1} onClick={() => changeQuery({ page: query.page - 1 })}>←</button><button aria-label="Next page" disabled={status !== 'success' || query.page >= result.totalPages} onClick={() => changeQuery({ page: query.page + 1 })}>→</button></div></footer>
          </section>
          {selected !== null && <ItemEditor key={selected} id={selected} onBusy={setBusy} onClose={() => setSelected(null)} onCompleted={(updated) => {
            // The response carries its own ID; never use a later selection.
            setResult((previous) => ({ ...previous, data: previous.data.map((entry) => entry.id === updated.id ? updated : entry) }))
            setNotice(`Item #${updated.id} marked complete.`)
            reload()
          }} onSaved={(message) => { setBusy(false); setSelected(null); setNotice(message); reload() }} />}
        </div>
        <footer className="page-footer"><span>Made for the details that matter.</span><span>ITEMSPACE / YOUR COLLECTION</span></footer>
      </main>
    </div>
  )
}

export default App
