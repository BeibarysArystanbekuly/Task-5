import { useEffect, useState } from 'react'
import { createItem, deleteItem, getItem, updateItem } from '../services/service.js'

export default function ItemEditor({ id, navigation, onClose, onSaved, onBusy, onCompleted }) {
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
          if (!result) {
            setStatus('missing')
            return
          }
          // Older records may not have the extended fields yet.
          setItem({ ...result,
            name: result.name ?? '', description: result.description ?? '',
            category: result.category ?? 'General', status: result.status ?? 'Planned',
            priority: result.priority ?? 'Normal', owner: result.owner ?? '', dueDate: result.dueDate ?? '',
          })
          setSavedStatus(result.status ?? 'Planned')
          setStatus('ready')
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message)
          setStatus(err.status === 404 || err.code === 'ITEM_NOT_FOUND' ? 'missing' : 'error')
        }
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
      {navigation}
      <div className="section-heading">
        <div><p className="eyebrow">{item.id ? `Item #${item.id}` : id === 'new' ? 'A fresh entry' : `Item #${id}`}</p><h2 id="editor-title">{id === 'new' && !item.id ? 'Create an item' : 'Item details'}</h2></div>
        <button className="icon-button" onClick={onClose} disabled={saving} aria-label="Close item details">×</button>
      </div>
      {status === 'loading' ? <p className="state" role="status">Loading item…</p> : status === 'missing' ? (
        <div className="state"><span className="state-symbol" aria-hidden="true">?</span><h3>Item not found</h3><p role="status">This item does not exist or has been deleted.</p></div>
      ) : status === 'error' ? (
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

