export interface Bookmark {
  id: string
  url: string
  title: string
  memo: string
  tags: string[]
  read: boolean
  createdAt: string
  updatedAt: string
}

export interface GistData {
  version: number
  bookmarks: Bookmark[]
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'
export type SyncError = string | null
export type ReadFilter = 'all' | 'read' | 'unread'
