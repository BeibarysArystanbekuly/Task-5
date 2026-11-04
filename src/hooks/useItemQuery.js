import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export default function useItemQuery() {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page'))
  const limit = Number(params.get('limit'))
  const query = {
    search: params.get('search') ?? '',
    sort: params.get('sort') === 'name-desc' ? 'name-desc' : 'name',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    limit: [5, 10, 20].includes(limit) ? limit : 10,
    category: params.get('category') ?? '',
    status: params.get('status') ?? '',
    priority: params.get('priority') ?? '',
  }

  const changeQuery = useCallback((changes, options = {}) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      for (const [key, value] of Object.entries(changes)) {
        if (value === '') next.delete(key)
        else next.set(key, String(value))
      }
      return next
    }, options)
  }, [setParams])

  // Omit inactive filters while preserving the existing API query format.
  const requestParams = new URLSearchParams(query)
  for (const field of ['category', 'status', 'priority']) {
    if (!query[field]) requestParams.delete(field)
  }
  return { query, queryString: `?${requestParams}`, changeQuery }
}
