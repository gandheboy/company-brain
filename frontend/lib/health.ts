let backendOnline = true
let lastCheck = 0

export async function isBackendOnline(): Promise<boolean> {
  // Cache check for 30 seconds
  const now = Date.now()
  if (now - lastCheck < 30000) return backendOnline

  try {
    const response = await fetch(
      'http://localhost:8000/health',
      { signal: AbortSignal.timeout(3000) }
    )
    backendOnline = response.ok
    lastCheck = now
    return backendOnline
  } catch {
    backendOnline = false
    lastCheck = now
    return false
  }
}