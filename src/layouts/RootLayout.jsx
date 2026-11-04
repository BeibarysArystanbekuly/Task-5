import { Suspense } from 'react'
import { Outlet } from 'react-router'
import NavBar from '../components/NavBar.jsx'
import LoadingState from '../components/LoadingState.jsx'

export default function RootLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content').focus() }}>Skip to content</a>
      <NavBar />
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
        <footer className="page-footer"><span>Made for the details that matter.</span><span>ITEMSPACE / YOUR COLLECTION</span></footer>
      </main>
    </div>
  )
}
