import { useState, useEffect, useCallback, useRef } from 'react'
import type { Bookmark, GistData, SyncStatus } from '../lib/types'
import { loadLocalData, saveLocalData, getToken, setToken, getGistId, setGistId } from '../lib/storage'
import { loadFromGist, saveToGist } from '../lib/gist'

type BookmarkDraft = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'read'>

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [token, setTokenState] = useState(() => getToken())
  const [gistId, setGistIdState] = useState(() => getGistId())

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gistIdRef = useRef(gistId)
  gistIdRef.current = gistId
  const tokenRef = useRef(token)
  tokenRef.current = token

  // Initial load: local first, then remote
  useEffect(() => {
    const local = loadLocalData()
    if (local?.bookmarks?.length) setBookmarks(local.bookmarks)

    const savedToken = getToken()
    const savedGistId = getGistId()
    if (savedToken && savedGistId) {
      pullFromGist(savedToken, savedGistId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function pullFromGist(t: string, g: string) {
    setSyncStatus('syncing')
    try {
      const data = await loadFromGist(t, g)
      if (data?.bookmarks) {
        setBookmarks(data.bookmarks)
        saveLocalData(data)
      }
      showSynced()
    } catch {
      setSyncStatus('error')
    }
  }

  function showSynced() {
    setSyncStatus('synced')
    setTimeout(() => setSyncStatus('idle'), 2000)
  }

  const pushToGist = useCallback((newBookmarks: Bookmark[]) => {
    const t = tokenRef.current
    if (!t) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)

    syncTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing')
      try {
        const data: GistData = { version: 1, bookmarks: newBookmarks }
        const newId = await saveToGist(t, gistIdRef.current || null, data)
        if (newId !== gistIdRef.current) {
          gistIdRef.current = newId
          setGistIdState(newId)
          setGistId(newId)
        }
        showSynced()
      } catch {
        setSyncStatus('error')
      }
    }, 2000)
  }, [])

  const commit = useCallback(
    (next: Bookmark[]) => {
      setBookmarks(next)
      saveLocalData({ version: 1, bookmarks: next })
      pushToGist(next)
    },
    [pushToGist],
  )

  const addBookmark = useCallback(
    (draft: BookmarkDraft) => {
      const bookmark: Bookmark = {
        ...draft,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      commit([bookmark, ...bookmarks])
    },
    [bookmarks, commit],
  )

  const deleteBookmark = useCallback(
    (id: string) => commit(bookmarks.filter((b) => b.id !== id)),
    [bookmarks, commit],
  )

  const toggleRead = useCallback(
    (id: string) =>
      commit(
        bookmarks.map((b) =>
          b.id === id ? { ...b, read: !b.read, updatedAt: new Date().toISOString() } : b,
        ),
      ),
    [bookmarks, commit],
  )

  const importBookmarks = useCallback(
    (drafts: BookmarkDraft[]): number => {
      const existingUrls = new Set(bookmarks.map((b) => b.url))
      const newOnes: Bookmark[] = drafts
        .filter((d) => !existingUrls.has(d.url))
        .map((d) => ({
          ...d,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      commit([...newOnes, ...bookmarks])
      return newOnes.length
    },
    [bookmarks, commit],
  )

  const saveSettings = useCallback(
    async (newToken: string, newGistId?: string) => {
      setToken(newToken)
      setTokenState(newToken)
      tokenRef.current = newToken
      if (newGistId) {
        setGistId(newGistId)
        setGistIdState(newGistId)
        gistIdRef.current = newGistId
      }
      if (newToken) {
        const g = newGistId ?? gistIdRef.current
        if (g) await pullFromGist(newToken, g)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const syncNow = useCallback(async () => {
    const t = tokenRef.current
    if (!t) return
    if (syncTimerRef.current) { clearTimeout(syncTimerRef.current); syncTimerRef.current = null }
    setSyncStatus('syncing')
    try {
      const data: GistData = { version: 1, bookmarks }
      const newId = await saveToGist(t, gistIdRef.current || null, data)
      if (newId !== gistIdRef.current) {
        gistIdRef.current = newId
        setGistIdState(newId)
        setGistId(newId)
      }
      showSynced()
    } catch {
      setSyncStatus('error')
    }
  }, [bookmarks])

  return {
    bookmarks,
    syncStatus,
    token,
    gistId,
    addBookmark,
    deleteBookmark,
    toggleRead,
    importBookmarks,
    saveSettings,
    syncNow,
  }
}
