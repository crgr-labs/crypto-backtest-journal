const API_URL = import.meta.env.VITE_API_URL

async function post(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    // text/plain avoids a CORS preflight against the Apps Script web app
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function listEntries() {
  const res = await fetch(`${API_URL}?action=list`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data.entries
}

export function createEntry(entry, imageBase64) {
  return post({ action: 'create', entry, imageBase64 })
}

export function updateEntry(id, entry, imageBase64) {
  return post({ action: 'update', id, entry, imageBase64 })
}

export function deleteEntry(id) {
  return post({ action: 'delete', id })
}
