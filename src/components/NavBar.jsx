import { Link, NavLink } from 'react-router'

export default function NavBar() {
  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Itemspace home">
        <span className="brand-mark" aria-hidden="true">i</span>
        Itemspace<span className="badge">WORKSPACE</span>
      </Link>
      <nav className="navigation" aria-label="Main navigation">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/items">Items</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/login">Login</NavLink>
      </nav>
    </header>
  )
}
