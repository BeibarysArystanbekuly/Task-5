const filters = [
  { field: 'category', label: 'Category', all: 'All categories', options: ['General', 'Operations', 'Support', 'Research', 'Equipment'] },
  { field: 'status', label: 'Status', all: 'All statuses', options: ['Planned', 'In progress', 'Completed', 'On hold'] },
  { field: 'priority', label: 'Priority', all: 'All priorities', options: ['Low', 'Normal', 'High', 'Urgent'] },
]

export default function ItemFilters({ query, hasFilters, onChange, onClear }) {
  return (
    <div className="filter-toolbar">
      <fieldset className="filter-fields">
        <legend className="sr-only">Filter items</legend>
        {filters.map(({ field, label, all, options }) => (
          <label key={field}>
            <span>{label}</span>
            <select aria-label={`Filter by ${field}`} value={query[field]} onChange={(event) => onChange({ [field]: event.target.value, page: 1 })}>
              <option value="">{all}</option>
              {options.map((value) => <option key={value}>{value}</option>)}
              {query[field] && !options.includes(query[field]) && <option>{query[field]}</option>}
            </select>
          </label>
        ))}
      </fieldset>
      {hasFilters && <button className="quiet" onClick={onClear}>Clear filters</button>}
    </div>
  )
}
