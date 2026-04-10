import type { ReadFilter } from '../lib/types'
import { tagColor } from '../lib/colors'

interface Props {
  tags: string[]
  filterStatus: ReadFilter
  filterTag: string | null
  onFilterStatus: (f: ReadFilter) => void
  onFilterTag: (t: string | null) => void
  total: number
}

const STATUS_TABS: { key: ReadFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'unread', label: '안읽음' },
  { key: 'read', label: '읽음' },
]

export default function FilterBar({ tags, filterStatus, filterTag, onFilterStatus, onFilterTag, total }: Props) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-14 z-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-2">
          {/* Status tabs */}
          <div className="flex items-center gap-1 shrink-0">
            {STATUS_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onFilterStatus(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          {tags.length > 0 && <span className="w-px h-5 bg-gray-200 shrink-0" />}

          {/* Tag chips */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {tags.map((tag) => {
                const active = filterTag === tag
                return (
                  <button
                    key={tag}
                    onClick={() => onFilterTag(active ? null : tag)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                      active
                        ? 'ring-2 ring-indigo-500 ring-offset-1 ' + tagColor(tag)
                        : tagColor(tag) + ' opacity-75 hover:opacity-100'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          )}

          {/* Count */}
          <span className="ml-auto shrink-0 text-xs text-gray-400 whitespace-nowrap">{total}개</span>
        </div>
      </div>
    </div>
  )
}
