import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/* ── Icons ── */
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

/* ── Markdown renderer ── */
function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children: code, ...props }) {
          return inline
            ? <code {...props}>{code}</code>
            : <pre><code className={className} {...props}>{code}</code></pre>
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

/* ── File chip (shown instead of raw file content) ── */
function FileChip({ file }) {
  const ext = file.name.split('.').pop().toLowerCase()
  const icon = file.kind === 'image' ? '🖼️' : '📄'
  return (
    <span className="file-chip" title={file.name}>
      {icon} 文件.{ext}
    </span>
  )
}

/* ── Message content ── */
function MessageContent({ content, isUser, displayText, files }) {
  // User messages: show displayText + file chips (hide injected file body)
  if (isUser) {
    const hasFiles = files && files.length > 0
    const text = displayText !== undefined ? displayText : (typeof content === 'string' ? content : '')

    // Content is an array (images + text) when images were attached
    if (Array.isArray(content)) {
      const imageParts = content.filter(p => p.type === 'image_url')
      return (
        <>
          {text && <p>{text}</p>}
          {hasFiles && (
            <div className="file-chips">
              {files.map((f, i) => <FileChip key={i} file={f} />)}
            </div>
          )}
          {imageParts.map((p, i) => (
            <img key={i} src={p.image_url.url} alt="attachment" className="chat-image" />
          ))}
        </>
      )
    }

    return (
      <>
        {text && <p>{text}</p>}
        {hasFiles && (
          <div className="file-chips">
            {files.map((f, i) => <FileChip key={i} file={f} />)}
          </div>
        )}
      </>
    )
  }

  // Assistant messages: full markdown render
  if (typeof content === 'string') return <Markdown>{content}</Markdown>

  return content.map((part, i) => {
    if (part.type === 'text') return <Markdown key={i}>{part.text}</Markdown>
    if (part.type === 'image_url') {
      return <img key={i} src={part.image_url.url} alt="attachment" className="chat-image" />
    }
    return null
  })
}

/* ── Extract plain text from a message for copying ── */
function extractText(message) {
  const { content, displayText, files } = message
  if (displayText !== undefined) {
    let text = displayText
    if (files && files.length) {
      text += '\n' + files.map(f => `[文件: ${f.name}]`).join('\n')
    }
    return text
  }
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('\n')
  }
  return ''
}

/* ── Main component ── */
export default function ChatMessage({ message, isLastUserMessage, onEditRequest }) {
  const { role, content, displayText, files } = message
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = extractText(message)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && <div className="msg-avatar" aria-label="assistant">✨</div>}

      <div className="msg-bubble-wrapper">
        <div className="msg-bubble">
          <MessageContent
            content={content}
            isUser={isUser}
            displayText={displayText}
            files={files}
          />
        </div>

        {/* Action buttons – visible on hover */}
        <div className="msg-actions">
          <button
            className={`msg-action-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title={copied ? '已复制！' : '复制'}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>

          {isUser && isLastUserMessage && (
            <button
              className="msg-action-btn"
              onClick={() => onEditRequest(message)}
              title="编辑并重新发送"
            >
              <EditIcon />
              <span>编辑</span>
            </button>
          )}
        </div>
      </div>

      {isUser && <div className="msg-avatar" aria-label="user">🧑</div>}
    </div>
  )
}
