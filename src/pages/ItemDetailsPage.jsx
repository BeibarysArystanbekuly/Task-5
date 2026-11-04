import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import ItemEditor from '../components/ItemEditor.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import { isValidItemId } from '../utils/itemId.js'
import '../styles/details.css'

export default function ItemDetailsPage() {
  const { id = 'new' } = useParams()
  const { busy, setBusy, closeEditor, onSaved, onCompleted } = useOutletContext()
  const { search } = useLocation()
  const navigate = useNavigate()
  // Browser history can leave this route even while its controls are disabled.
  useEffect(() => () => setBusy(false), [id, setBusy])

  function goBack(event) {
    if (busy) {
      event.preventDefault()
      return
    }
    // HashRouter starts a fresh tab at index zero. Direct entry must fall back
    // to the collection rather than send the user to an unrelated website.
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && window.history.state?.idx > 0) {
      event.preventDefault()
      navigate(-1)
    }
  }

  const navigation = (
    <nav className="details-navigation" aria-label="Item navigation">
      <Link to={{ pathname: '/items', search }} onClick={goBack} aria-disabled={busy}><span aria-hidden="true">← </span>Back</Link>
      <Link to="/items" aria-disabled={busy} onClick={(event) => { if (busy) event.preventDefault() }}>All Items<span aria-hidden="true"> ↗</span></Link>
    </nav>
  )

  if (id !== 'new' && !isValidItemId(id)) return <NotFoundPage item />

  return <ItemEditor key={id} id={id} navigation={navigation} onBusy={setBusy} onClose={closeEditor} onSaved={onSaved} onCompleted={onCompleted} />
}
