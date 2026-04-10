import { useState, useEffect } from 'react'
import { testGistConnection } from '../lib/gist'

interface Props {
  token: string
  gistId: string
  onSave: (token: string, gistId?: string) => Promise<void>
  onClose: () => void
}

export default function SettingsModal({ token: initToken, gistId: initGistId, onSave, onClose }: Props) {
  const [token, setToken] = useState(initToken)
  const [gistId, setGistId] = useState(initGistId)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleTest() {
    if (!token) return
    setTesting(true)
    setTestResult(null)
    const ok = await testGistConnection(token)
    setTestResult(ok)
    setTesting(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(token.trim(), gistId.trim() || undefined)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSave}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">설정</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="bg-indigo-50 text-indigo-800 text-xs rounded-lg p-3 leading-relaxed">
          <strong>기기 간 동기화</strong>를 위해 GitHub Gist를 사용합니다.<br />
          GitHub에서 <code className="bg-indigo-100 px-1 rounded">gist</code> 권한만 있는 Personal Access Token (PAT)을 발급하세요.
          <br />
          <a
            href="https://github.com/settings/tokens/new?scopes=gist&description=ReadList+App"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium mt-1 inline-block"
          >
            GitHub PAT 발급하기 →
          </a>
        </div>

        {/* Token */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">GitHub Personal Access Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={token}
              onChange={(e) => { setToken(e.target.value); setTestResult(null) }}
              placeholder="ghp_xxxxxxxxxxxx"
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
            <button
              type="button"
              onClick={handleTest}
              disabled={!token || testing}
              className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-40 shrink-0"
            >
              {testing ? '…' : '테스트'}
            </button>
          </div>
          {testResult === true && <p className="text-xs text-green-600 mt-1">연결 성공! 토큰이 유효합니다.</p>}
          {testResult === false && <p className="text-xs text-red-500 mt-1">연결 실패. 토큰을 확인해 주세요.</p>}
        </div>

        {/* Gist ID */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Gist ID <span className="text-gray-400 font-normal">(자동 생성됩니다. 다른 기기에서 동기화하려면 입력)</span></label>
          <input
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder="a1b2c3d4e5f6…"
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
          />
          {gistId && (
            <a
              href={`https://gist.github.com/${gistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-500 hover:underline mt-1 inline-block"
            >
              Gist에서 직접 보기 →
            </a>
          )}
        </div>

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
