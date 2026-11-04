import { Link } from 'react-router'
import collectionImage from '../assets/collection-hero.svg'
import '../styles/pages.css'

export default function HomePage() {
  return (
    <section className="panel home-hero" aria-labelledby="home-title">
      <div className="home-copy">
        <p className="eyebrow">Welcome to Itemspace</p>
        <h1 id="home-title">A little order. A clearer view.</h1>
        <p className="intro">Keep your collection in one place. Find the item you need, capture its details, and follow it from planned to complete.</p>
        <div className="form-actions">
          <Link className="button primary" to="/items">Open your collection</Link>
          <Link className="button" to="/dashboard">View dashboard</Link>
        </div>
        <Link className="inline-link" to="/about">Get to know Itemspace <span aria-hidden="true">→</span></Link>
      </div>
      <figure className="home-image">
        <img src={collectionImage} width="640" height="480" alt="Illustration of organized collection cards and a completed item" decoding="async" />
        <figcaption>A place for every detail.</figcaption>
      </figure>
    </section>
  )
}
