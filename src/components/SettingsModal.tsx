import { useState, useEffect } from 'react'
import { testGistConnection } from '../lib/gist'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition shrink-0"
    >
      {copied ? '복사됨 ✓' : '복사'}
    </button>
  )
}

interface Props {
  token: string
  gistId: string
  syncError: string | null
  onSave: (token: string, gistId: string) => Promise<void>
  onClose: () => void
}

export default function SettingsModal({ token: initToken, gistId: initGistId, syncError, onSave, onClose }: Props) {
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
    await onSave(token.trim(), gistId.trim())
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

        {/* 에러 표시 */}
        {syncError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            <p className="font-semibold mb-1">동기화 실패 원인</p>
            <p className="font-mono break-all mb-2">{syncError}</p>
            <p>
              {syncError.includes('401') && '→ Token이 만료됐거나 잘못됐습니다. 아래에서 재입력 후 테스트 버튼을 눌러보세요.'}
              {syncError.includes('403') && '→ Token에 gist 권한이 없습니다. gist 스코프로 새 Token을 발급하세요.'}
              {syncError.includes('404') && '→ Gist ID가 틀렸거나 삭제됐습니다. PC의 Gist ID를 다시 확인하세요.'}
              {syncError.includes('fetch') && '→ 네트워크에 연결할 수 없습니다. 인터넷 연결을 확인하세요.'}
              {!syncError.includes('401') && !syncError.includes('403') && !syncError.includes('404') && !syncError.includes('fetch') && '→ Token과 Gist ID를 확인해 주세요.'}
            </p>
          </div>
        )}

        {/* 기기 간 동기화 방법 */}
        <details className="group">
          <summary className="text-xs font-medium text-indigo-600 cursor-pointer select-none">
            기기 간 동기화 설정 방법 보기 ▸
          </summary>
          <ol className="mt-2 text-xs text-gray-600 leading-relaxed list-decimal list-inside space-y-1">
            <li><strong>PC에서</strong> GitHub PAT를 발급하고 Token 입력 후 저장</li>
            <li>북마크를 하나 추가하면 Gist ID가 자동 생성됨</li>
            <li>다시 설정을 열어 Gist ID 옆 <strong>복사</strong> 버튼 클릭</li>
            <li><strong>iPhone에서</strong> 같은 Token과 복사한 Gist ID 입력 후 저장</li>
          </ol>
          <p className="mt-2 text-xs text-gray-400">Token은 각 기기에 따로 입력해야 합니다 (기기 간 공유 안 됨)</p>
        </details>

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
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={gistId}
              onChange={(e) => setGistId(e.target.value)}
              placeholder="a1b2c3d4e5f6…"
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
            {gistId && <CopyButton text={gistId} />}
          </div>
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
          {!gistId && (
            <p className="text-xs text-amber-600 mt-1">⚠ Gist ID가 없으면 동기화할 수 없습니다. 먼저 데스크탑에서 저장하면 자동 생성됩니다.</p>
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
