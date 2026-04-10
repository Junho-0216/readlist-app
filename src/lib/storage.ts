import type { GistData } from './types'

const KEYS = {
  DATA: 'readlist_data',
  TOKEN: 'readlist_github_token',
  GIST_ID: 'readlist_gist_id',
} as const

export function loadLocalData(): GistData | null {
  try {
    const raw = localStorage.getItem(KEYS.DATA)
    return raw ? (JSON.parse(raw) as GistData) : null
  } catch {
    return null
  }
}

export function saveLocalData(data: GistData): void {
  localStorage.setItem(KEYS.DATA, JSON.stringify(data))
}

export function getToken(): string {
  return localStorage.getItem(KEYS.TOKEN) ?? ''
}

export function setToken(token: string): void {
  token ? localStorage.setItem(KEYS.TOKEN, token) : localStorage.removeItem(KEYS.TOKEN)
}

export function getGistId(): string {
  return localStorage.getItem(KEYS.GIST_ID) ?? ''
}

export function setGistId(id: string): void {
  id ? localStorage.setItem(KEYS.GIST_ID, id) : localStorage.removeItem(KEYS.GIST_ID)
}
