import { useAnalyticsStore, type EventName, type AnalyticsEvent } from '@/store/useAnalyticsStore'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(): string {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('carpi_sid')
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem('carpi_sid', id)
  }
  return id
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile'
  return 'desktop'
}

export function detectTrafficSource(): string {
  if (typeof window === 'undefined') return 'direct'
  const params = new URLSearchParams(window.location.search)
  const utm = params.get('utm_source')
  if (utm) {
    const social = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin']
    return social.some(s => utm.toLowerCase().includes(s)) ? 'social' : utm
  }
  const ref = document.referrer.toLowerCase()
  if (!ref) return 'direct'
  const socialDomains = ['instagram.com', 'facebook.com', 't.co', 'twitter.com', 'tiktok.com', 'youtube.com', 'linkedin.com']
  const organicDomains = ['google.', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'yandex.']
  if (socialDomains.some(d => ref.includes(d))) return 'social'
  if (organicDomains.some(d => ref.includes(d))) return 'organic'
  return 'referral'
}

// ---------------------------------------------------------------------------
// Batched event queue — flushes via requestIdleCallback or 500 ms timeout
// ---------------------------------------------------------------------------

let _queue: AnalyticsEvent[] = []
let _flushScheduled = false

function flush() {
  _flushScheduled = false
  if (!_queue.length) return
  const batch = [..._queue]
  _queue = []
  useAnalyticsStore.getState().addEvents(batch)
}

function scheduleFlush() {
  if (_flushScheduled) return
  _flushScheduled = true
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => flush(), { timeout: 2000 })
  } else {
    setTimeout(flush, 500)
  }
}

// ---------------------------------------------------------------------------
// Core tracking function
// ---------------------------------------------------------------------------

export function track(eventName: EventName, metadata: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const sessionId = getOrCreateSessionId()
  if (!sessionId) return

  _queue.push({
    id: genId(),
    event_type: eventName,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    metadata: { url: window.location.pathname, ...metadata },
  })

  scheduleFlush()
}

// ---------------------------------------------------------------------------
// Session initialization — called once per app load
// ---------------------------------------------------------------------------

let _sessionInit = false

export function initSession() {
  if (typeof window === 'undefined' || _sessionInit) return
  _sessionInit = true

  const isNew = !sessionStorage.getItem('carpi_sid')
  getOrCreateSessionId()

  if (isNew) {
    const params = new URLSearchParams(window.location.search)
    track('session_start', {
      referrer: document.referrer || '',
      source: detectTrafficSource(),
      device: getDeviceType(),
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      ...(params.get('utm_source') ? { utm_source: params.get('utm_source') } : {}),
      ...(params.get('utm_medium') ? { utm_medium: params.get('utm_medium') } : {}),
      ...(params.get('utm_campaign') ? { utm_campaign: params.get('utm_campaign') } : {}),
    })
  }
}

// ---------------------------------------------------------------------------
// Per-page scroll depth tracker — returns cleanup function
// ---------------------------------------------------------------------------

export function createScrollTracker(url: string): () => void {
  if (typeof window === 'undefined') return () => {}
  const milestones = [25, 50, 75, 100]
  const reached = new Set<number>()
  let ticking = false

  const handler = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      const scrolled = window.scrollY + window.innerHeight
      const total = document.documentElement.scrollHeight
      const pct = Math.min(100, Math.round((scrolled / total) * 100))
      milestones.forEach(m => {
        if (pct >= m && !reached.has(m)) {
          reached.add(m)
          track('scroll_depth', { depth: m, url })
        }
      })
    })
  }

  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}

// ---------------------------------------------------------------------------
// Per-page time tracker — returns function that fires the event when called
// ---------------------------------------------------------------------------

export function createTimeTracker(url: string): () => void {
  const start = Date.now()
  return () => {
    const secs = Math.round((Date.now() - start) / 1000)
    if (secs > 3) track('time_on_page', { url, duration_seconds: secs })
  }
}
