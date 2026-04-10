function decodeHTMLEntities(str: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  }
  return str.replace(/&[a-z#0-9]+;/gi, (e) => map[e] ?? e)
}

export async function fetchPageTitle(url: string): Promise<string | null> {
  const proxies = [
    () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`),
    () => fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`),
  ]

  for (const makeRequest of proxies) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      const res = await makeRequest()
      clearTimeout(timeout)

      if (!res.ok) continue

      let html: string
      const ct = res.headers.get('content-type') ?? ''
      if (ct.includes('json')) {
        const data = await res.json()
        html = typeof data === 'string' ? data : (data.contents as string) ?? ''
      } else {
        html = await res.text()
      }

      const match = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
      if (match?.[1]) return decodeHTMLEntities(match[1].trim())
    } catch {
      continue
    }
  }

  return null
}
