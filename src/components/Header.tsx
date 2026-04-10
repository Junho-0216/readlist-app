import type { SyncStatus, SyncError } from '../lib/types'

interface Props {
  search: string
  onSearch: (v: string) => void
  onAdd: () => void
  onImport: () => void
  onSettings: () => void
  syncStatus: SyncStatus
  syncError: SyncError
  onSyncNow: () => void
  hasToken: boolean
}

function SyncIndicator({ status, syncError, onSyncNow, hasToken }: { status: SyncStatus; syncError: SyncError; onSyncNow: () => void; hasToken: boolean }) {
  if (!hasToken) return null

  const errorLabel = syncError
    ? `동기화 실패: ${syncError} — 탭하여 재시도`
    : '동기화 실패 — 탭하여 재시도'

  const icons: Record<SyncStatus, React.ReactNode> = {
    idle: (
      <button onClick={onSyncNow} title="지금 동기화" className="text-gray-400 hover:text-indigo-500 transition-colors p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    ),
    syncing: (
      <span title="동기화 중…" className="text-indigo-400 p-1">
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </span>
    ),
    synced: (
      <span title="동기화 완료" className="text-green-500 p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    ),
    error: (
      <div className="relative group">
        <button onClick={onSyncNow} title={errorLabel} className="text-red-400 hover:text-red-600 p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {syncError && (
          <div className="absolute right-0 top-8 z-50 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <p className="font-medium text-red-300 mb-1">동기화 실패</p>
            <p className="font-mono break-all">{syncError}</p>
            <p className="mt-1 text-gray-400">설정에서 Token·Gist ID를 확인하세요</p>
          </div>
        )}
      </div>
    ),
  }

  return <span className="flex items-center">{icons[status]}</span>
}

export default function Header({ search, onSearch, onAdd, onImport, onSettings, syncStatus, syncError, onSyncNow, hasToken }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <span className="text-indigo-600 font-bold text-lg tracking-tight shrink-0 select-none">ReadList</span>

        {/* Search */}
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="제목, URL, 메모 검색…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <SyncIndicator status={syncStatus} syncError={syncError} onSyncNow={onSyncNow} hasToken={hasToken} />

          <button
            onClick={onImport}
            title="북마크 가져오기"
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>

          <button
            onClick={onSettings}
            title="설정"
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button
            onClick={onAdd}
            title="링크 추가"
            className="ml-1 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">추가</span>
          </button>
        </div>
      </div>
    </header>
  )
}
