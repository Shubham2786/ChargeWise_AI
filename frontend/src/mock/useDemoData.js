/**
 * useDemoData — React hook that:
 * 1. Tries the real API first
 * 2. Falls back to mock data on error or when backend is unavailable
 * 3. Slightly refreshes mock data every 5 seconds ("live illusion")
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getTick } from './dataGenerator'

/**
 * @param {() => Promise<any>} apiFetcher  - async function calling the real API
 * @param {(tick: number) => any} mockFn   - mock data generator (receives current tick)
 * @param {object} opts
 *   liveInterval  number  ms between mock refreshes (default 5000)
 *   transform      fn     optional fn to transform API response to expected shape
 */
export function useDemoData(apiFetcher, mockFn, opts = {}) {
  const { liveInterval = 5000, transform = null } = opts

  const [data,    setData]    = useState(() => mockFn(getTick()))
  const [loading, setLoading] = useState(true)
  const [source,  setSource]  = useState('mock')   // 'api' | 'mock'
  const intervalRef = useRef(null)

  const fetchReal = useCallback(async () => {
    try {
      const res = await apiFetcher()
      const shaped = transform ? transform(res.data) : res.data
      if (shaped != null) {
        setData(shaped)
        setSource('api')
        setLoading(false)
        return true  // success
      }
    } catch {
      // fall through to mock
    }
    return false
  }, [apiFetcher, transform])

  useEffect(() => {
    let alive = true

    const init = async () => {
      const ok = await fetchReal()
      if (alive && !ok) {
        // Backend unavailable — use mock + start live refresh
        setData(mockFn(getTick()))
        setSource('mock')
        setLoading(false)

        intervalRef.current = setInterval(() => {
          if (alive) setData(mockFn(getTick()))
        }, liveInterval)
      }
    }

    init()
    return () => {
      alive = false
      clearInterval(intervalRef.current)
    }
  }, [])   // intentionally run once on mount

  return { data, loading, source }
}

/**
 * useCountUp — animates a number from 0 to `target` over `duration` ms.
 */
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target == null || isNaN(target)) return
    const start = Date.now()
    const from  = 0
    const to    = parseFloat(target)

    const tick = () => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(parseFloat((from + (to - from) * eased).toFixed(1)))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return value
}
