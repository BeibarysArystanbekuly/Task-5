import { Link } from 'react-router'
import LoadingState from '../components/LoadingState.jsx'
import ItemFilters from '../components/ItemFilters.jsx'
import DataBreakdown from '../components/DataBreakdown.jsx'
import DashboardStatistics from '../components/DashboardStatistics.jsx'
import useDashboard from '../hooks/useDashboard.js'
import useItemQuery from '../hooks/useItemQuery.js'
import '../styles/items.css'
import '../styles/dashboard.css'

export default function DashboardPage() {
  const { query, queryString, changeQuery } = useItemQuery()
  const { data, status, error, reload } = useDashboard(queryString)
  const hasFilters = Boolean(query.search || query.category || query.status || query.priority)

  function clearFilters() {
    changeQuery({ search: '', category: '', status: '', priority: '', page: 1 })
  }

  function matchingItems(changes = {}) {
    const params = new URLSearchParams()
    const selection = { search: query.search, category: query.category, status: query.status, priority: query.priority, ...changes }
    for (const [field, value] of Object.entries(selection)) {
      if (value) params.set(field, value)
    }
    return { pathname: '/items', search: params.size ? `?${params}` : '' }
  }

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Your workspace at a glance</p><h1>Dashboard</h1><p className="intro">Track your collection and find the next detail that needs your attention.</p></div><Link className="button primary" to="/items/new">New item</Link></div>
      <section className="panel dashboard-controls" aria-labelledby="dashboard-filters-title">
        <div className="section-heading"><h2 id="dashboard-filters-title">Focus your overview</h2><button className="quiet" onClick={reload} disabled={status === 'loading'}>↻ Refresh statistics</button></div>
        <div className="dashboard-search"><label className="search"><span className="sr-only">Search dashboard items</span><input type="search" placeholder="Search names or descriptions…" value={query.search} onChange={(event) => changeQuery({ search: event.target.value, page: 1 }, { replace: true })} /></label></div>
        <ItemFilters query={query} hasFilters={hasFilters} onChange={changeQuery} onClear={clearFilters} />
      </section>
      <div className="dashboard-results" aria-busy={status === 'loading'}>
        {status === 'loading' ? <LoadingState>Loading your dashboard…</LoadingState> : status === 'error' ? <div className="panel state"><h2>We couldn’t load your dashboard</h2><p role="alert">{error}</p><button onClick={reload}>Try again</button></div> : <>
          <p className="dashboard-scope" role="status">{hasFilters ? 'Statistics for matching items' : 'Statistics for your entire collection'}</p>
          <DashboardStatistics statistics={data.statistics} />
          {data.statistics.total === 0 && <section className="panel dashboard-empty" aria-labelledby="dashboard-empty-title"><h2 id="dashboard-empty-title">{hasFilters ? 'No matching items' : 'Your collection is ready for its first item'}</h2><p>{hasFilters ? 'Change your search or filters to explore another selection.' : 'Create an item to start seeing your collection’s progress.'}</p>{hasFilters ? <button onClick={clearFilters}>Show all items</button> : <Link className="button primary" to="/items/new">Create an item</Link>}</section>}
          <div className="dashboard-breakdowns">
            <DataBreakdown title="By category" entries={data.breakdowns.category} total={data.statistics.total} getLink={(category) => matchingItems({ category })} />
            <DataBreakdown title="By status" entries={data.breakdowns.status} total={data.statistics.total} getLink={(itemStatus) => matchingItems({ status: itemStatus })} />
          </div>
          <section className="panel dashboard-preview" aria-labelledby="dashboard-preview-title">
            <div className="section-heading"><div><h2 id="dashboard-preview-title">From your collection</h2><p className="dashboard-muted">An alphabetical preview of this selection.</p></div><Link className="button" to={matchingItems()}>{hasFilters ? 'View matching items' : 'View all items'}</Link></div>
            {data.items.length ? <ul className="dashboard-items">{data.items.map((item) => <li key={item.id}><Link to={{ pathname: `/items/${item.id}`, search: matchingItems().search }}>{item.name}<span>{item.status ?? 'Planned'} →</span></Link></li>)}</ul> : <p className="dashboard-muted">No items to preview.</p>}
          </section>
        </>}
      </div>
    </>
  )
}
