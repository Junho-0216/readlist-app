import { useState, useMemo } from 'react'
import type { ReadFilter } from './lib/types'
import { useBookmarks } from './hooks/useBookmarks'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import BookmarkCard from './components/BookmarkCard'
import BookmarkForm from './components/BookmarkForm'
import SettingsModal from './components/SettingsModal'
import ImportModal from './components/ImportModal'

export default function App() {
  const {
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
  } = useBookmarks()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<ReadFilter>('all')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    bookmarks.forEach((b) => b.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [bookmarks])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return bookmarks.filter((b) => {
      if (filterStatus === 'read' && !b.read) return false
      if (filterStatus === 'unread' && b.read) return false
      if (filterTag && !b.tags.includes(filterTag)) return false
      if (q && !b.title.toLowerCase().includes(q) && !b.url.toLowerCase().includes(q) && !b.memo.toLowerCase().includes(q)) return false
      return true
    })
  }, [bookmarks, filterStatus, filterTag, search])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        search={search}
        onSearch={setSearch}
        onAdd={() => setShowForm(true)}
        onImport={() => setShowImport(true)}
        onSettings={() => setShowSettings(true)}
        syncStatus={syncStatus}
        syncError={syncError}
        onSyncNow={syncNow}
        hasToken={!!token}
      />

      {/* 모바일에서도 보이는 에러 배너 */}
      {syncStatus === 'error' && syncError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-red-700 flex-1 min-w-0">
            <span className="font-semibold">동기화 실패:</span> {syncError}
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs text-red-600 font-semibold underline shrink-0"
          >
            설정 확인
          </button>
        </div>
      )}

      <FilterBar
        tags={allTags}
        filterStatus={filterStatus}
        filterTag={filterTag}
        onFilterStatus={setFilterStatus}
        onFilterTag={setFilterTag}
        total={filtered.length}
      />

      <main className="flex-1 px-4 py-4 max-w-5xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {bookmarks.length === 0 ? (
              <>
                <div className="text-5xl mb-3">🔖</div>
                <p className="text-lg font-medium text-gray-500">저장된 링크가 없습니다</p>
                <p className="text-sm mt-1">+ 버튼을 눌러 첫 링크를 추가해 보세요</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-lg font-medium text-gray-500">검색 결과가 없습니다</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <BookmarkCard
                key={b.id}
                bookmark={b}
                onDelete={deleteBookmark}
                onToggleRead={toggleRead}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <BookmarkForm
          allTags={allTags}
          onAdd={addBookmark}
          onClose={() => setShowForm(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          token={token}
          gistId={gistId}
          syncError={syncError}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showImport && (
        <ImportModal
          onImport={importBookmarks}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
