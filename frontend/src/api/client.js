const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    let detail = res.statusText
    try { detail = (await res.json()).detail ?? detail } catch { /* ignore */ }
    throw new Error(detail)
  }
  return res.json()
}

// ── Legacy history ──
export const fetchHistory  = () => request('/history')
export const clearHistory  = () => request('/history', { method: 'DELETE' })

// ── Models ──
export const fetchModels = () => request('/models')

// ── Profile ──
export const fetchProfile  = () => request('/profile')
export const clearProfile  = () => request('/profile', { method: 'DELETE' })

export function saveHistory(messages) {
  return request('/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
}

// ── Multi-conversation ──
export const listConversations = () => request('/conversations')

export const createConversation = (title = '新对话') =>
  request('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })

export const getConversation = (id) => request(`/conversations/${id}`)

export const deleteConversation = (id) =>
  request(`/conversations/${id}`, { method: 'DELETE' })

export const renameConversation = (id, title) =>
  request(`/conversations/${id}/title`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })

export const putConversationMessages = (id, messages, title) =>
  request(`/conversations/${id}/messages`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, title: title ?? null }),
  })

// ── Chat ──
export function checkStatus(apiKey, model) {
  return request('/check-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, model }),
  })
}

export function sendChat({ apiKey, model, messages, temperature = 0.7, maxTokens = 4096, systemPrompt = '', conversationId = null }) {
  return request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key:         apiKey,
      model,
      messages,
      temperature,
      max_tokens:      maxTokens,
      conversation_id: conversationId ?? undefined,
      ...(systemPrompt && systemPrompt.trim() ? { system_prompt: systemPrompt.trim() } : {}),
    }),
  })
}
