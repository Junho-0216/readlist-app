import { useState, useRef, useEffect, DragEvent } from 'react'
import { parseNetscapeBookmarks } from '../lib/importParser'
import type { Bookmark } from '../lib/types'

type Draft = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'read'>

interface Props {
  onImport: (drafts: Draft[]) => number
  onClose: () => void
}

export default function ImportModal({ onImport, onClose }: Props) {
  const [drafts, setDrafts] = useState<Draft[] | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function processFile(file: File) {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setError('HTML 파일만 가져올 수 있습니다.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const html = e.target?.result as string
      const parsed = parseNetscapeBookmarks(html)
      if (parsed.length === 0) {
        setError('가져올 수 있는 북마크가 없습니다.')
      } else {
        setDrafts(parsed)
        setError('')
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleConfirm() {
    if (!drafts) return
    const count = onImport(drafts)
    alert(`${count}개의 링크를 가져왔습니다. (중복 제외)`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">북마크 가져오기</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 -mt-2">
          Chrome, Firefox, Safari 등의 브라우저에서 내보낸 북마크 HTML 파일을 선택하세요.
        </p>

        {/* Drop zone */}
        {!drafts ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">📂</div>
            <p className="text-sm font-medium text-gray-600">파일을 여기에 드래그하거나</p>
            <p className="text-sm text-indigo-600 font-medium mt-0.5">클릭해서 선택</p>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]) }}
            />
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">✅</div>
            <p className="text-sm font-semibold text-green-700">{drafts.length}개의 링크 발견</p>
            <p className="text-xs text-green-600 mt-0.5">중복된 URL은 자동으로 건너뜁니다</p>
          </div>
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!drafts}
            className="flex-1 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-40"
          >
            가져오기
          </button>
        </div>
      </div>
    </div>
  )
}
