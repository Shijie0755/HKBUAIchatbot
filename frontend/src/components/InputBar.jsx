import { useState, useRef, useEffect } from 'react'

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function FileThumb({ file, onRemove }) {
  return (
    <div className="file-thumb">
      {file.kind === 'image' ? (
        <img src={file.preview} alt={file.name} />
      ) : (
        <div className="file-thumb-icon">
          <span>{file.kind === 'text' ? '📄' : '📎'}</span>
          <span className="file-thumb-name">{file.name}</span>
        </div>
      )}
      <button
        className="thumb-remove"
        onClick={() => onRemove(file.id)}
        aria-label="Remove file"
      >
        ×
      </button>
    </div>
  )
}

/**
 * @param {string}   prefillText  - text to pre-fill (for edit mode); changes trigger a sync
 * @param {number}   prefillKey   - bump this to force re-fill when prefillText hasn't changed
 */
export default function InputBar({ pendingFiles, onSend, onFilesAdd, onFileRemove, isLoading, prefillText = '', prefillKey = 0 }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Sync pre-fill when edit mode is triggered
  useEffect(() => {
    if (prefillText !== undefined && prefillText !== '') {
      setText(prefillText)
      // Auto-resize
      const ta = textareaRef.current
      if (ta) {
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
        ta.focus()
        ta.setSelectionRange(ta.value.length, ta.value.length)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKey])

  const canSend = (text.trim().length > 0 || pendingFiles.length > 0) && !isLoading

  const submit = () => {
    if (!canSend) return
    onSend(text)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const handleChange = e => {
    setText(e.target.value)
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 180) + 'px' }
  }

  const handleFileChange = e => {
    if (e.target.files?.length) { onFilesAdd(e.target.files); e.target.value = '' }
  }

  return (
    <div className="input-bar">
      {/* Thumbnails row */}
      {pendingFiles.length > 0 && (
        <div className="thumbnail-row">
          {pendingFiles.map(f => (
            <FileThumb key={f.id} file={f} onRemove={onFileRemove} />
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="input-row">
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
          aria-label="Attach files"
          disabled={isLoading}
        >
          <PlusIcon />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask HKBU GenAI Tool"
          rows={1}
          disabled={isLoading}
          aria-label="Message input"
        />

        <button
          className={`send-btn ${canSend ? 'active' : ''}`}
          onClick={submit}
          disabled={!canSend}
          title="Send"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="file-input-hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
