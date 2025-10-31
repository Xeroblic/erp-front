import tokenManager from '@/services/auth/tokenManager'

export type StreamController = {
  close: () => void
}

const API_BASE = import.meta.env.VITE_API_URL || ''

type Options = {
  history?: number
  lastEventId?: number
}

// Native EventSource no permite headers. Usamos fetch con reader
// para poder enviar Authorization y manejar reconexión a nivel caller.
export function openNotificationsStream(
  onNotification: (payload: any) => void,
  onOpen?: () => void,
  onError?: (err: any) => void,
  opts: Options = {},
): StreamController | null {
  if (!API_BASE) return null
  const token = tokenManager.getAccessToken()
  const params = new URLSearchParams()
  if (typeof opts.history === 'number') params.set('history', String(opts.history))
  if (typeof opts.lastEventId === 'number' && opts.lastEventId > 0) params.set('lastEventId', String(opts.lastEventId))

  const url = `${API_BASE}/me/notifications/stream?${params.toString()}`
  const controller = new AbortController()

  const run = async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: token
          ? { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache', 'Authorization': `Bearer ${token}` }
          : { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error(`SSE HTTP ${res.status}`)
      onOpen && onOpen()
      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // El servidor cierra a ~60s. Avisar para que el caller reconecte.
          onError && onError(new Error('SSE stream ended'))
          break
        }
        buffer += decoder.decode(value, { stream: true })
        // Separar eventos por doble newline
        let idx
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const lines = raw.split(/\r?\n/)
          let event: string | null = null
          let data = ''
          let id: string | null = null
          for (const ln of lines) {
            if (ln.startsWith('event:')) event = ln.slice(6).trim()
            else if (ln.startsWith('data:')) data += ln.slice(5).trim()
            else if (ln.startsWith('id:')) id = ln.slice(3).trim()
          }
          if (event === 'notification' && data) {
            try { onNotification(JSON.parse(data)) } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      onError && onError(err)
    }
  }

  run()

  return {
    close: () => controller.abort(),
  }
}

