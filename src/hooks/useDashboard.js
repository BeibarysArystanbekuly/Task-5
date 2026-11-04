import { useEffect, useState } from 'react'
import { getDashboard } from '../services/service.js'

export default function useDashboard(queryString) {
  const [refresh, setRefresh] = useState(0)
  const [request, setRequest] = useState({ queryString: null, status: 'loading', data: null, error: '' })

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await getDashboard(queryString)
        if (!ignore) setRequest({ queryString, data, status: 'success', error: '' })
      } catch (error) {
        if (!ignore) setRequest({ queryString, data: null, status: 'error', error: error.message })
      }
    }
    load()
    return () => { ignore = true }
  }, [queryString, refresh])

  function reload() {
    setRequest((previous) => ({ ...previous, status: 'loading', error: '' }))
    setRefresh((value) => value + 1)
  }

  return { ...request, status: request.queryString === queryString ? request.status : 'loading', reload }
}
