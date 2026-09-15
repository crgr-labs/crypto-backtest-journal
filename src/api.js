const API_URL = import.meta.env.VITE_API_URL

function checkApiUrl() {
  if (!API_URL) {
    throw new Error(
      'VITE_API_URL is not configured. Please add the VITE_API_URL repository secret in GitHub Settings > Secrets and variables > Actions, then re-run the deployment.'
    )
  }
}

async function post(body) {
  checkApiUrl()
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
  checkApiUrl()
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
