import { useState, useEffect } from 'react'
import { checkStatus } from '../api/client.js'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_AI_ROLE = ''

export default function SettingsModal({
  apiKey,
  model,
  temperature,
  maxTokens,
  aiRole,
  models,
  onSaveModelSettings,
  onRestoreModelDefaults,
  onSaveUserSettings,
  onResetUserSettings,
  onClearChat,
  onShowToast,
  onClose,
}) {
  const modelKeys = Object.keys(models)

  /* Draft state for model section – synced when modal opens */
  const [draftModel, setDraftModel] = useState(model)
  const [draftTemperature, setDraftTemperature] = useState(temperature)
  const [draftMaxTokens, setDraftMaxTokens] = useState(maxTokens)
  const [draftAiRole, setDraftAiRole] = useState(aiRole)

  /* Draft state for user section */
  const [draftApiKey, setDraftApiKey] = useState(apiKey)
  const [showApiKey, setShowApiKey] = useState(false)

  /* Test connection state */
  const [testStatus, setTestStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [testError, setTestError] = useState('')

  useEffect(() => {
    setDraftModel(model)
    setDraftTemperature(temperature)
    setDraftMaxTokens(maxTokens)
    setDraftAiRole(aiRole)
    setDraftApiKey(apiKey)
  }, [model, temperature, maxTokens, aiRole, apiKey])

  const handleSaveModel = () => {
    onSaveModelSettings(draftModel, draftTemperature, draftMaxTokens, draftAiRole)
  }

  const handleRestoreDefaults = () => {
    setDraftModel(DEFAULT_MODEL)
    setDraftTemperature(DEFAULT_TEMPERATURE)
    setDraftMaxTokens(DEFAULT_MAX_TOKENS)
    setDraftAiRole(DEFAULT_AI_ROLE)
    onRestoreModelDefaults()
  }

  const handleSaveUser = () => {
    onSaveUserSettings(draftApiKey)
  }

  const handleResetUser = () => {
    setDraftApiKey('')
    setTestStatus(null)
    setTestError('')
    onResetUserSettings()
  }

  const handleTestConnection = async () => {
    if (!draftApiKey?.trim()) return
    setTestStatus('loading')
    setTestError('')
    try {
      const data = await checkStatus(draftApiKey.trim(), draftModel)
      if (data.ok) {
        setTestStatus('success')
        onShowToast?.('✅ 连接成功')
      } else {
        setTestStatus('error')
        setTestError(data.message || '未知错误')
        onShowToast?.('❌ 连接失败')
      }
    } catch (err) {
      setTestStatus('error')
      setTestError(err.message || '请求失败')
      onShowToast?.('❌ 连接失败')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel settings-modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ 设置</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body modal-body-cols">
          {/* ── 左栏：模型与生成设置 ── */}
          <section className="settings-col settings-col-model">
            <h3 className="settings-col-title">模型与生成</h3>

            <div className="field-group">
              <label>🤖 选择模型</label>
              <select
                value={draftModel}
                onChange={e => setDraftModel(e.target.value)}
              >
                {(modelKeys.length ? modelKeys : [draftModel]).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>🌡️ Temperature — {draftTemperature.toFixed(2)}</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={draftTemperature}
                onChange={e => setDraftTemperature(parseFloat(e.target.value))}
              />
            </div>

            <div className="field-group">
              <label>📏 Max Tokens — {draftMaxTokens.toLocaleString()}</label>
              <input
                type="range"
                min={256}
                max={32768}
                step={256}
                value={draftMaxTokens}
                onChange={e => setDraftMaxTokens(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="field-group">
              <label>🎭 AI 角色 / 系统提示</label>
              <textarea
                className="field-textarea"
                value={draftAiRole}
                onChange={e => setDraftAiRole(e.target.value)}
                placeholder="可选：描述 AI 的角色或行为，如「你是一位代码审查助手」"
                rows={3}
              />
            </div>

            <div className="settings-col-actions">
              <button type="button" className="btn-primary" onClick={handleSaveModel}>
                保存
              </button>
              <button type="button" className="btn-secondary" onClick={handleRestoreDefaults}>
                恢复默认设置
              </button>
            </div>
          </section>

          {/* ── 右栏：用户设置 ── */}
          <section className="settings-col settings-col-user">
            <h3 className="settings-col-title">用户设置</h3>

            <div className="field-group">
              <label>🔑 API Key</label>
              <div className="field-api-key-wrap">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={draftApiKey}
                  onChange={e => setDraftApiKey(e.target.value)}
                  placeholder="Enter HKBU API Key"
                  autoComplete="off"
                  className="field-api-key-input"
                />
                <button
                  type="button"
                  className="btn-toggle-visibility"
                  onClick={() => setShowApiKey(s => !s)}
                  aria-label={showApiKey ? '隐藏' : '显示'}
                  title={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="field-group settings-test-wrap">
              <button
                type="button"
                className={`btn-test-connection ${testStatus === 'success' ? 'btn-test-success' : ''} ${testStatus === 'error' ? 'btn-test-error' : ''}`}
                onClick={handleTestConnection}
                disabled={testStatus === 'loading' || !draftApiKey?.trim()}
              >
                {testStatus === 'loading' && <span className="btn-test-spinner" aria-hidden />}
                {testStatus === 'loading' && ' 检测中…'}
                {testStatus === 'success' && '✅ 连接成功'}
                {testStatus === 'error' && '❌ 连接失败'}
                {!testStatus && '🔗 测试 API 连接'}
              </button>
              {testStatus === 'error' && testError && (
                <p className="settings-test-error" role="alert">{testError}</p>
              )}
            </div>

            <div className="settings-col-actions">
              <button type="button" className="btn-primary" onClick={handleSaveUser}>
                保存用户设置
              </button>
              <button type="button" className="btn-secondary" onClick={handleResetUser}>
                重新设置用户设置
              </button>
            </div>

            <hr className="modal-divider" />

            <div className="modal-actions">
              <button type="button" className="btn-danger" onClick={onClearChat}>
                🗑️ 清空聊天记录
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
