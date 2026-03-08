import { useState } from 'react'

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ChevronIcon({ direction = 'left' }) {
  const rotate = direction === 'right' ? '180deg' : '0deg'
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ transform: `rotate(${rotate})` }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr + 'Z')
    const now = new Date()
    const diffMs = now - d
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function ConversationItem({ conversation, isActive, onSelect, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)

  const commitRename = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed)
    } else {
      setEditTitle(conversation.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') { setEditTitle(conversation.title); setIsEditing(false) }
  }

  return (
    <div
      className={`conv-item ${isActive ? 'active' : ''}`}
      onClick={() => !isEditing && onSelect()}
    >
      <div className="conv-item-main">
        {isEditing ? (
          <input
            className="conv-rename-input"
            value={editTitle}
            autoFocus
            onChange={e => setEditTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="conv-title">{conversation.title}</div>
            <div className="conv-meta">{formatDate(conversation.updated_at)}</div>
          </>
        )}
      </div>
      <div className="conv-actions" onClick={e => e.stopPropagation()}>
        <button
          className="conv-action-btn"
          title="重命名"
          onClick={() => setIsEditing(true)}
        >
          <PencilIcon />
        </button>
        <button
          className="conv-action-btn danger"
          title="删除"
          onClick={() => {
            if (window.confirm('确定要删除这个对话吗？')) onDelete()
          }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  isOpen,
  onToggle,
}) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Header */}
      <div className="sidebar-header">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={isOpen ? '收起侧边栏' : '展开侧边栏'}
          aria-label="Toggle sidebar"
        >
          <ChevronIcon direction={isOpen ? 'left' : 'right'} />
        </button>
        {isOpen && <span className="sidebar-label">对话历史</span>}
      </div>

      {isOpen && (
        <>
          {/* New chat button */}
          <button className="new-chat-btn" onClick={onCreate}>
            <PlusIcon />
            <span>新对话</span>
          </button>

          {/* Conversation list */}
          <div className="conv-list">
            {conversations.length === 0 && (
              <div className="conv-empty">暂无对话历史</div>
            )}
            {conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onSelect={() => onSelect(conv.id)}
                onDelete={() => onDelete(conv.id)}
                onRename={title => onRename(conv.id, title)}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  )
}
