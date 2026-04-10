import type { GistData } from './types'

const FILENAME = 'readlist-data.json'
const API = 'https://api.github.com'

function headers(token: string): Record<string, string> {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

export async function loadFromGist(token: string, gistId: string): Promise<GistData | null> {
  const res = await fetch(`${API}/gists/${gistId}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const gist = await res.json()
  const file = (gist.files as Record<string, { content: string }>)?.[FILENAME]
  if (!file?.content) return null
  return JSON.parse(file.content) as GistData
}

export async function saveToGist(token: string, gistId: string | null, data: GistData): Promise<string> {
  const body = JSON.stringify({
    description: 'ReadList App Data',
    public: false,
    files: { [FILENAME]: { content: JSON.stringify(data, null, 2) } },
  })

  if (gistId) {
    const res = await fetch(`${API}/gists/${gistId}`, { method: 'PATCH', headers: headers(token), body })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return gistId
  } else {
    const res = await fetch(`${API}/gists`, { method: 'POST', headers: headers(token), body })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const gist = await res.json()
    return gist.id as string
  }
}

export async function testGistConnection(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/gists`, { headers: headers(token) })
    return res.ok
  } catch {
    return false
  }
}
