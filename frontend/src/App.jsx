import { useState, useEffect, useRef, useCallback } from 'react'

import ChatMessage   from './components/ChatMessage.jsx'
import InputBar      from './components/InputBar.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import DragOverlay   from './components/DragOverlay.jsx'
import TokenFooter   from './components/TokenFooter.jsx'
import Sidebar       from './components/Sidebar.jsx'

import { useChat, processFile } from './hooks/useChat.js'
import {
  fetchModels, clearProfile,
  listConversations, createConversation, deleteConversation, renameConversation,
} from './api/client.js'

const FALLBACK_MODEL_NAMES = [
  'o3-mini', 'o1', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini', 'gpt-5',
  'gemini-2.5-flash', 'gemini-2.5-pro',
]

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83
               2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33
               1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
               A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06
               a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15
               a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
               A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06
               a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68
               a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
               a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06
               a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9
               a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
               a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function ThinkingIndicator() {
  return (
    <div className="thinking-indicator">
      <div className="thinking-avatar">✨</div>
      <div className="thinking-dots"><span /><span /><span /></div>
    </div>
  )
}

export default function App() {
  /* ── Persisted settings ── */
  const [apiKey,      setApiKey]      = useState(() => localStorage.getItem('hkbu_api_key') ?? '')
  const [model,       setModel]       = useState(() => localStorage.getItem('hkbu_model')   ?? 'gemini-2.5-flash')
  const [temperature, setTemperature] = useState(() => {
    const v = parseFloat(localStorage.getItem('hkbu_temperature') ?? '0.7')
    return Number.isFinite(v) ? v : 0.7
  })
  const [maxTokens,   setMaxTokens]   = useState(() => {
    const v = parseInt(localStorage.getItem('hkbu_max_tokens') ?? '4096', 10)
    return Number.isFinite(v) && v >= 256 ? v : 4096
  })
  const [aiRole,      setAiRole]      = useState(() => localStorage.getItem('hkbu_ai_role') ?? '')
  const [models,      setModels]      = useState({})

  /* ── Sidebar / conversation state ── */
  const [sidebarOpen,       setSidebarOpen]       = useState(true)
  const [conversations,     setConversations]     = useState([])
  const [activeConvId,      setActiveConvId]      = useState(null)

  /* ── UI state ── */
  const [pendingFiles,  setPendingFiles]  = useState([])
  const [isDragging,    setIsDragging]    = useState(false)
  const [settingsOpen,  setSettingsOpen]  = useState(false)
  const [toastMessage,  setToastMessage]  = useState(null)

  /* ── Edit mode state ── */
  const [editPrefill,   setEditPrefill]   = useState('')
  const [editPrefillKey, setEditPrefillKey] = useState(0)
  const [isEditing,     setIsEditing]     = useState(false)

  /* ── Chat hook ── */
  const { messages, isLoading, error, sessionTokens, send, editLastUserMessage, clearChat } =
    useChat({ apiKey, model, temperature, maxTokens, systemPrompt: aiRole, conversationId: activeConvId })

  const bottomRef      = useRef(null)
  const dragCounterRef = useRef(0)

  /* Load available models */
  useEffect(() => {
    fetchModels()
      .then(d => {
        const details = d.details && Object.keys(d.details).length > 0
          ? d.details
          : Object.fromEntries((d.models || []).map(m => [m, {}]))
        setModels(details)
      })
      .catch(() => {
        setModels(Object.fromEntries(FALLBACK_MODEL_NAMES.map(m => [m, {}])))
      })
  }, [])

  /* Load conversations list on mount; auto-create one if none exist */
  useEffect(() => {
    listConversations()
      .then(async d => {
        const convs = d.conversations ?? []
        if (convs.length > 0) {
          setConversations(convs)
          setActiveConvId(convs[0].id)
        } else {
          // Bootstrap with a first conversation
          const conv = await createConversation('新对话')
          setConversations([conv])
          setActiveConvId(conv.id)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Persist settings */
  useEffect(() => { localStorage.setItem('hkbu_api_key',      apiKey) }, [apiKey])
  useEffect(() => { localStorage.setItem('hkbu_model',        model)  }, [model])
  useEffect(() => { localStorage.setItem('hkbu_temperature', String(temperature)) }, [temperature])
  useEffect(() => { localStorage.setItem('hkbu_max_tokens',  String(maxTokens))   }, [maxTokens])
  useEffect(() => { localStorage.setItem('hkbu_ai_role',     aiRole) }, [aiRole])

  /* Auto-scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  /* ── Global drag-and-drop ── */
  useEffect(() => {
    const onEnter = e => {
      e.preventDefault()
      dragCounterRef.current++
      setIsDragging(true)
    }
    const onLeave = () => {
      dragCounterRef.current--
      if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setIsDragging(false) }
    }
    const onDrop = async e => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      const processed = (await Promise.all(files.map(processFile)))
        .filter(f => f && f.kind !== 'unsupported')
      setPendingFiles(prev => [...prev, ...processed])
    }
    const onOver = e => e.preventDefault()

    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('drop',     onDrop)
    window.addEventListener('dragover', onOver)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('drop',     onDrop)
      window.removeEventListener('dragover', onOver)
    }
  }, [])

  /* ── Conversation handlers ── */
  const refreshConversations = useCallback(() => {
    listConversations()
      .then(d => setConversations(d.conversations ?? []))
      .catch(() => {})
  }, [])

  const handleNewConversation = useCallback(async () => {
    try {
      const conv = await createConversation('新对话')
      setConversations(prev => [conv, ...prev])
      setActiveConvId(conv.id)
      setIsEditing(false)
      setEditPrefill('')
    } catch (e) {
      console.error('Failed to create conversation', e)
    }
  }, [])

  const handleSelectConversation = useCallback((id) => {
    setActiveConvId(id)
    setIsEditing(false)
    setEditPrefill('')
  }, [])

  const handleDeleteConversation = useCallback(async (id) => {
    try {
      await deleteConversation(id)
      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== id)
        if (activeConvId === id) {
          setActiveConvId(filtered.length > 0 ? filtered[0].id : null)
        }
        return filtered
      })
    } catch (e) {
      console.error('Failed to delete conversation', e)
    }
  }, [activeConvId])

  const handleRenameConversation = useCallback(async (id, title) => {
    try {
      await renameConversation(id, title)
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
    } catch (e) {
      console.error('Failed to rename conversation', e)
    }
  }, [])

  /* Refresh conversation list after a message exchange (to update title/count) */
  useEffect(() => {
    if (messages.length > 0 && activeConvId) {
      refreshConversations()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  /* ── Message handlers ── */
  const handleSend = useCallback(async (text) => {
    const filesToSend = [...pendingFiles]
    setPendingFiles([])
    setIsEditing(false)
    setEditPrefill('')

    if (isEditing) {
      await editLastUserMessage(text, filesToSend)
    } else {
      await send(text, filesToSend)
    }
  }, [pendingFiles, isEditing, editLastUserMessage, send])

  const handleFilesAdd = async fileList => {
    const processed = (await Promise.all(Array.from(fileList).map(processFile)))
      .filter(Boolean)
    setPendingFiles(prev => [...prev, ...processed])
  }

  /* Edit request from ChatMessage */
  const handleEditRequest = useCallback((message) => {
    const text = message.displayText !== undefined
      ? message.displayText
      : (typeof message.content === 'string' ? message.content : '')
    setEditPrefill(text)
    setEditPrefillKey(k => k + 1)
    setIsEditing(true)
  }, [])

  const handleClearChat = async () => {
    await clearChat()
    setSettingsOpen(false)
  }

  const handleResetProfile = async () => {
    await clearProfile()
    setSettingsOpen(false)
  }

  const showSavedToast = () => {
    setToastMessage('设置已经保存')
    setTimeout(() => setToastMessage(null), 2000)
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleSaveModelSettings = (nextModel, nextTemp, nextMaxTokens, nextAiRole) => {
    setModel(nextModel)
    setTemperature(nextTemp)
    setMaxTokens(nextMaxTokens)
    setAiRole(nextAiRole)
    showSavedToast()
  }

  const handleRestoreModelDefaults = () => {
    setModel('gemini-2.5-flash')
    setTemperature(0.7)
    setMaxTokens(4096)
    setAiRole('')
  }

  const handleSaveUserSettings = (nextApiKey) => {
    setApiKey(nextApiKey)
    showSavedToast()
  }

  const handleResetUserSettings = async () => {
    setApiKey('')
    await clearProfile()
    showSavedToast()
  }

  /* Determine the index of the last user message (for edit button) */
  let lastUserMsgIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') { lastUserMsgIdx = i; break }
  }

  /* ── Render ── */
  return (
    <div className="app-root">
      {/* ── Sidebar ── */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={handleSelectConversation}
        onCreate={handleNewConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
      />

      {/* ── Main content ── */}
      <div className="app-main">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-inner">
            <div className="header-logo">
              <span className="logo-icon">✨</span>
              <span className="logo-text">HKBU GenAI Workstation</span>
            </div>
            <button
              className="settings-btn"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              aria-label="Open settings"
            >
              <GearIcon />
            </button>
          </div>
        </header>

        {/* ── Chat area ── */}
        <main className="chat-area">
          {messages.length === 0 && !isLoading && (
            <div className="empty-state">
              <span className="empty-icon">✨</span>
              <h2>How can I help you today?</h2>
              <p>Type a message, or drag &amp; drop images / code files to analyze them.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              isLastUserMessage={i === lastUserMsgIdx}
              onEditRequest={handleEditRequest}
            />
          ))}

          {isLoading && <ThinkingIndicator />}

          {error && <div className="error-banner">⚠️ {error}</div>}

          <div ref={bottomRef} />
        </main>

        {/* ── Edit mode banner ── */}
        {isEditing && (
          <div className="edit-mode-banner">
            正在编辑上一条消息
            <button onClick={() => { setIsEditing(false); setEditPrefill('') }}>取消</button>
          </div>
        )}

        {/* ── Floating input bar ── */}
        <InputBar
          pendingFiles={pendingFiles}
          onSend={handleSend}
          onFilesAdd={handleFilesAdd}
          onFileRemove={id => setPendingFiles(prev => prev.filter(f => f.id !== id))}
          isLoading={isLoading}
          prefillText={editPrefill}
          prefillKey={editPrefillKey}
        />

        {/* ── Token footer ── */}
        <TokenFooter model={model} tokens={sessionTokens} />

        {/* ── Settings modal ── */}
        {settingsOpen && (
          <SettingsModal
            apiKey={apiKey}
            model={model}
            temperature={temperature}
            maxTokens={maxTokens}
            aiRole={aiRole}
            models={models}
            onSaveModelSettings={handleSaveModelSettings}
            onRestoreModelDefaults={handleRestoreModelDefaults}
            onSaveUserSettings={handleSaveUserSettings}
            onResetUserSettings={handleResetUserSettings}
            onClearChat={handleClearChat}
            onShowToast={showToast}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {/* ── Toast ── */}
        {toastMessage && <div className="toast">{toastMessage}</div>}

        {/* ── Drag overlay ── */}
        {isDragging && <DragOverlay />}
      </div>
    </div>
  )
}
