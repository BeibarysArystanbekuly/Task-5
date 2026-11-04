import { Link } from 'react-router'
import '../styles/pages.css'

export default function AboutPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">A workspace for the details</p><h1>About Itemspace</h1><p className="intro">A simple way to organize your collection and keep work moving.</p></div></div>
      <section className="panel content-panel about-project" aria-labelledby="about-project-title">
        <h2 id="about-project-title">Make room for what matters.</h2>
        <p>Itemspace is a collection management project built to give everyday items a little more structure. It brings descriptions, ownership, priorities, and progress together in one workspace.</p>
        <div className="about-features">
          <article><span className="feature-number" aria-hidden="true">01</span><h3>Find your focus</h3><p>Search names and descriptions, sort your collection, and browse at your own pace.</p></article>
          <article><span className="feature-number" aria-hidden="true">02</span><h3>Keep the details</h3><p>Give each item a category, priority, owner, and due date so its next step is clear.</p></article>
          <article><span className="feature-number" aria-hidden="true">03</span><h3>Follow your progress</h3><p>Update an item’s status, mark it complete, or open your dashboard for a quick overview.</p></article>
        </div>
        <div className="about-storage">
          <h2>Saved in this browser</h2>
          <p>This demo saves your collection locally in this browser. Changes are available when you return on the same browser; they are not synced between devices. Requests can take a moment, and you can retry if one fails.</p>
        </div>
        <Link className="button primary" to="/items">Explore your collection</Link>
      </section>
    </>
  )
}
