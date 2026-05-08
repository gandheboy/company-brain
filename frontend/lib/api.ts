const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Get auth token from Supabase session
import { supabase } from './supabase'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  return headers
}

// GET request
export async function apiGet(endpoint: string) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}

// POST request
export async function apiPost(endpoint: string, body: any) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}

// DELETE request
export async function apiDelete(endpoint: string) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}