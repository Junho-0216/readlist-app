import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import type { Bookmark } from '../lib/types'
import { tagColor } from '../lib/colors'
import { fetchPageTitle } from '../hooks/useTitleFetch'

type Draft = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'read'>

interface Props {
  allTags: string[]
  onAdd: (draft: Draft) => void
  onClose: () => void
}

export default function BookmarkForm({ allTags, onAdd, onClose }: Props) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    urlRef.current?.focus()
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleFetchTitle() {
    if (!url) return
    setFetching(true)
    setFetchError(false)
    const t = await fetchPageTitle(url)
    setFetching(false)
    if (t) setTitle(t)
    else setFetchError(true)
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url) return
    onAdd({ url: url.trim(), title: title.trim() || url.trim(), memo: memo.trim(), tags })
    onClose()
  }

  const suggestedTags = allTags.filter((t) => !tags.includes(t) && t.includes(tagInput.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">링크 추가</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* URL */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">URL *</label>
          <div className="flex gap-2">
            <input
              ref={urlRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleFetchTitle}
              disabled={!url || fetching}
              className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-40 shrink-0"
            >
              {fetching ? '…' : '제목 가져오기'}
            </button>
          </div>
          {fetchError && <p className="text-xs text-red-500 mt-1">제목을 가져오지 못했습니다. 직접 입력해 주세요.</p>}
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="페이지 제목"
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Memo */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="나중에 참고할 내용…"
            rows={3}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">태그</label>
          <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent min-h-[42px]">
            {tags.map((t) => (
              <span key={t} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(t)}`}>
                {t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:opacity-70">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length ? '' : '태그 입력 후 Enter…'}
              className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
            />
          </div>
          {/* Tag suggestions */}
          {tagInput && suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {suggestedTags.slice(0, 8).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(t)} hover:opacity-80`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-1"
        >
          저장
        </button>
      </form>
    </div>
  )
}
