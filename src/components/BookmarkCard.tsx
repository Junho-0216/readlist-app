import type { Bookmark } from '../lib/types'
import { tagColor } from '../lib/colors'

interface Props {
  bookmark: Bookmark
  onDelete: (id: string) => void
  onToggleRead: (id: string) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' })
}

function faviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}

async function share(bookmark: Bookmark) {
  const data = { title: bookmark.title, text: bookmark.memo || bookmark.title, url: bookmark.url }
  if (navigator.share) {
    try { await navigator.share(data) } catch { /* user cancelled */ }
  } else {
    await navigator.clipboard.writeText(bookmark.url)
    alert('URL이 클립보드에 복사되었습니다.')
  }
}

export default function BookmarkCard({ bookmark, onDelete, onToggleRead }: Props) {
  const { id, url, title, memo, tags, read, createdAt } = bookmark
  const favicon = faviconUrl(url)

  return (
    <article
      className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col transition-opacity ${
        read ? 'opacity-60' : ''
      }`}
    >
      {/* Main link area */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 p-4 group"
      >
        <div className="flex items-start gap-3">
          {favicon && (
            <img
              src={favicon}
              alt=""
              width={20}
              height={20}
              className="mt-0.5 shrink-0 rounded-sm"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
              {title || url}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{shortUrl(url)}</p>
          </div>
        </div>

        {memo && (
          <p className="mt-2 text-xs text-gray-600 leading-relaxed line-clamp-3">{memo}</p>
        )}

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(t)}`}>
                {t}
              </span>
            ))}
          </div>
        )}
      </a>

      {/* Footer actions */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(createdAt)}</span>

        <div className="flex items-center gap-0.5">
          {/* Share */}
          <button
            onClick={() => share(bookmark)}
            title="공유"
            className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Read toggle */}
          <button
            onClick={() => onToggleRead(id)}
            title={read ? '안읽음으로 표시' : '읽음으로 표시'}
            className={`p-1.5 rounded-md transition-colors ${
              read
                ? 'text-green-500 hover:text-gray-400 hover:bg-gray-50'
                : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
            }`}
          >
            <svg className="w-4 h-4" fill={read ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm(`"${title || url}"을(를) 삭제할까요?`)) onDelete(id)
            }}
            title="삭제"
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}
