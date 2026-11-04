import { Link } from 'react-router'
import '../styles/pages.css'

export default function LoginPage() {
  return (
    <section className="panel login-layout" aria-labelledby="login-title">
      <div className="login-introduction">
        <span className="brand-mark" aria-hidden="true">i</span>
        <p className="eyebrow">Your local workspace</p>
        <h2>A home for your collection.</h2>
        <p>Keep your ideas, everyday essentials, and all the little details together.</p>
        <p className="login-aside-note">A little order. A clearer view.</p>
      </div>
      <div className="login-content">
        <span className="coming-soon">Coming soon</span>
        <h1 id="login-title">Login</h1>
        <p className="intro" id="login-description">Account sign-in is planned for a future update. You can use your collection without an account today.</p>
        <form className="login-form" aria-label="Future login" aria-describedby="login-description login-note" onSubmit={(event) => event.preventDefault()}>
          <fieldset disabled>
            <legend className="sr-only">Future sign-in options</legend>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" autoComplete="username" placeholder="you@example.com" />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" placeholder="Your password" />
            <button className="primary" type="submit">Sign in — coming soon</button>
          </fieldset>
          <p className="login-note" id="login-note">This is a preview. Sign-in fields are disabled until authentication is available.</p>
        </form>
        <Link className="inline-link" to="/items">Continue to your collection <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  )
}
