import { useState, useEffect, useCallback, useRef } from 'react'
import type { Bookmark, GistData, SyncStatus, SyncError } from '../lib/types'
import { loadLocalData, saveLocalData, getToken, setToken, getGistId, setGistId } from '../lib/storage'
import { loadFromGist, saveToGist } from '../lib/gist'

type BookmarkDraft = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'read'>

const AUTO_SYNC_INTERVAL = 60_000 // 60초마다 자동 pull

function mergeBookmarks(local: Bookmark[], remote: Bookmark[]): Bookmark[] {
  const map = new Map<string, Bookmark>()
  for (const b of local) map.set(b.id, b)
  for (const b of remote) {
    const existing = map.get(b.id)
    if (!existing || new Date(b.updatedAt) > new Date(existing.updatedAt)) {
      map.set(b.id, b)
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<SyncError>(null)
  const [token, setTokenState] = useState(() => getToken())
  const [gistId, setGistIdState] = useState(() => getGistId())

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSyncingRef = useRef(false) // 동시 pull 방지 락
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

  // 앱이 포그라운드로 돌아올 때 자동 pull (iPhone에서 다른 앱 다녀온 경우)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const t = tokenRef.current
        const g = gistIdRef.current
        if (t && g) pullFromGist(t, g, true) // silent: UI 스피너 없이 백그라운드 pull
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 60초 주기로 자동 pull
  useEffect(() => {
    autoSyncRef.current = setInterval(() => {
      const t = tokenRef.current
      const g = gistIdRef.current
      if (t && g) pullFromGist(t, g, true) // silent: 60초 자동 pull은 UI 방해 안 함
    }, AUTO_SYNC_INTERVAL)
    return () => {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function pullFromGist(t: string, g: string, silent = false) {
    if (isSyncingRef.current) return // 이미 동기화 중이면 스킵
    isSyncingRef.current = true
    if (!silent) {
      setSyncStatus('syncing')
      setSyncError(null)
    }
    try {
      const data = await loadFromGist(t, g)
      if (data?.bookmarks) {
        setBookmarks(prev => {
          const merged = mergeBookmarks(prev, data.bookmarks)
          saveLocalData({ version: 1, bookmarks: merged })
          return merged
        })
      }
      if (!silent) showSynced()
    } catch (e) {
      if (!silent) {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류'
        setSyncError(msg)
        setSyncStatus('error')
      }
    } finally {
      isSyncingRef.current = false
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
      setSyncError(null)
      try {
        const data: GistData = { version: 1, bookmarks: newBookmarks }
        const newId = await saveToGist(t, gistIdRef.current || null, data)
        if (newId !== gistIdRef.current) {
          gistIdRef.current = newId
          setGistIdState(newId)
          setGistId(newId)
        }
        showSynced()
      } catch (e) {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류'
        setSyncError(msg)
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
    async (newToken: string, newGistId: string) => {
      setToken(newToken)
      setTokenState(newToken)
      tokenRef.current = newToken
      // 빈 문자열 포함 항상 덮어씀 (기존 잘못된 값 삭제 가능하도록)
      setGistId(newGistId)
      setGistIdState(newGistId)
      gistIdRef.current = newGistId
      if (newToken && newGistId) {
        await pullFromGist(newToken, newGistId)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const syncNow = useCallback(async () => {
    const t = tokenRef.current
    const g = gistIdRef.current
    if (!t) return
    if (isSyncingRef.current) return // 이미 동기화 중이면 스킵
    if (syncTimerRef.current) { clearTimeout(syncTimerRef.current); syncTimerRef.current = null }
    isSyncingRef.current = true
    setSyncStatus('syncing')
    setSyncError(null)
    try {
      let merged = bookmarks
      // Gist ID가 있을 때만 pull 시도 (없으면 잘못된 API 호출 방지)
      if (g) {
        const remote = await loadFromGist(t, g)
        if (remote?.bookmarks) {
          merged = mergeBookmarks(bookmarks, remote.bookmarks)
          setBookmarks(merged)
          saveLocalData({ version: 1, bookmarks: merged })
        }
      }
      const data: GistData = { version: 1, bookmarks: merged }
      const newId = await saveToGist(t, g || null, data)
      if (newId !== gistIdRef.current) {
        gistIdRef.current = newId
        setGistIdState(newId)
        setGistId(newId)
      }
      showSynced()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류'
      setSyncError(msg)
      setSyncStatus('error')
    } finally {
      isSyncingRef.current = false
    }
  }, [bookmarks])

  return {
    bookmarks,
    syncStatus,
    syncError,
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
