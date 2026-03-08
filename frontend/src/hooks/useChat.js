import { useState, useEffect, useCallback } from 'react'
import { sendChat, getConversation } from '../api/client'

/* ── File types ── */
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
const TEXT_EXTS  = new Set(['py','cpp','c','h','txt','md','java','js','ts','html','css','json','xml','csv','pdf'])

/** Read a File object → structured attachment object */
export function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (IMAGE_EXTS.has(ext)) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target.result
        const base64  = dataUrl.split(',')[1]
        const mime    = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`
        resolve({ id: crypto.randomUUID(), name: file.name, kind: 'image', preview: dataUrl, base64, mime })
      }
      reader.readAsDataURL(file)
    })
  }

  if (TEXT_EXTS.has(ext)) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        resolve({ id: crypto.randomUUID(), name: file.name, kind: 'text', preview: null, content: e.target.result })
      }
      reader.readAsText(file)
    })
  }

  return Promise.resolve({ id: crypto.randomUUID(), name: file.name, kind: 'other', preview: null })
}

/**
 * Build API content from text + file attachments.
 * Returns { content, displayText, filesMeta }
 *   - content:     full payload sent to the AI API
 *   - displayText: plain user text (without injected file content), shown in UI
 *   - filesMeta:   lightweight file info { name, kind } stored with the message
 */
function buildContent(text, files) {
  const filesMeta = files.map(f => ({ name: f.name, kind: f.kind }))

  if (!files.length) return { content: text, displayText: text, filesMeta: [] }

  let combined = text
  const imageParts = []

  for (const f of files) {
    if (f.kind === 'image') {
      imageParts.push({ type: 'image_url', image_url: { url: `data:${f.mime};base64,${f.base64}` } })
    } else if (f.kind === 'text') {
      combined += `\n\n📎 \`${f.name}\`\n\`\`\`\n${f.content}\n\`\`\``
    } else {
      combined += `\n\n📎 Attached: \`${f.name}\` (binary / unsupported preview)`
    }
  }

  const content = imageParts.length
    ? [{ type: 'text', text: combined }, ...imageParts]
    : combined

  return { content, displayText: text, filesMeta }
}

/** Serialize only the API-relevant fields of a message for sending */
function toApiMessage(msg) {
  return { role: msg.role, content: msg.content }
}

/** Custom hook – owns messages, loading, error, token counts */
export function useChat({ apiKey, model, temperature, maxTokens, systemPrompt, conversationId }) {
  const [messages,      setMessages]      = useState([])
  const [isLoading,     setIsLoading]     = useState(false)
  const [error,         setError]         = useState(null)
  const [sessionTokens, setSessionTokens] = useState({ in: 0, out: 0 })

  // Load conversation messages whenever conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setSessionTokens({ in: 0, out: 0 })
      setError(null)
      return
    }
    getConversation(conversationId)
      .then(d => setMessages((d.messages ?? []).filter(m => m.role !== 'system')))
      .catch(() => setMessages([]))
  }, [conversationId])

  const send = useCallback(async (text, files = []) => {
    if (!apiKey) { setError('Configure your API Key in Settings ⚙️'); return }
    if (!text.trim() && !files.length) return

    const { content, displayText, filesMeta } = buildContent(text, files)
    const userMsg  = { role: 'user', content, displayText, files: filesMeta }
    const history  = [...messages, userMsg]

    setMessages(history)
    setIsLoading(true)
    setError(null)

    try {
      const { reply, usage } = await sendChat({
        apiKey, model,
        messages: history.map(toApiMessage),
        temperature, maxTokens, systemPrompt,
        conversationId,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setSessionTokens(prev => ({
        in:  prev.in  + (usage?.prompt_tokens     ?? 0),
        out: prev.out + (usage?.completion_tokens  ?? 0),
      }))
    } catch (e) {
      setError(e.message)
      // Rollback optimistic user message on error
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, model, temperature, maxTokens, systemPrompt, messages, conversationId])

  /**
   * Edit the last user message.
   * Removes the last user message (and any assistant reply after it),
   * then re-sends with the new text and optional files.
   */
  const editLastUserMessage = useCallback(async (newText, files = []) => {
    let lastUserIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { lastUserIdx = i; break }
    }
    if (lastUserIdx === -1) return

    // Keep everything before the last user message
    const trimmed = messages.slice(0, lastUserIdx)
    setMessages(trimmed)

    if (!apiKey) { setError('Configure your API Key in Settings ⚙️'); return }
    if (!newText.trim() && !files.length) return

    const { content, displayText, filesMeta } = buildContent(newText, files)
    const userMsg  = { role: 'user', content, displayText, files: filesMeta }
    const history  = [...trimmed, userMsg]

    setMessages(history)
    setIsLoading(true)
    setError(null)

    try {
      const { reply, usage } = await sendChat({
        apiKey, model,
        messages: history.map(toApiMessage),
        temperature, maxTokens, systemPrompt,
        conversationId,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setSessionTokens(prev => ({
        in:  prev.in  + (usage?.prompt_tokens     ?? 0),
        out: prev.out + (usage?.completion_tokens  ?? 0),
      }))
    } catch (e) {
      setError(e.message)
      setMessages(trimmed)
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, model, temperature, maxTokens, systemPrompt, messages, conversationId])

  const clearChat = useCallback(async () => {
    setMessages([])
    setSessionTokens({ in: 0, out: 0 })
    setError(null)
  }, [])

  return { messages, isLoading, error, sessionTokens, send, editLastUserMessage, clearChat, setError }
}
