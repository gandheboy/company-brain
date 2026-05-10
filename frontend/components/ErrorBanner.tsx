'use client'
import { useState, useEffect } from 'react'

interface ErrorBannerProps {
  message?: string
  type?: 'error' | 'warning' | 'info'
  onDismiss?: () => void
}

interface BackendOfflineBannerProps {
  show: boolean
}

interface LoadingSpinnerProps {
  message?: string
}

export function ErrorBanner({
  message,
  type = 'error',
  onDismiss
}: ErrorBannerProps) {
  if (!message) return null

  const colors = {
    error: {
      bg: '#450a0a',
      border: '#dc2626',
      text: '#fca5a5',
      icon: '❌'
    },
    warning: {
      bg: '#1c1400',
      border: '#d97706',
      text: '#fcd34d',
      icon: '⚠️'
    },
    info: {
      bg: '#0c1a2e',
      border: '#3b82f6',
      text: '#93c5fd',
      icon: 'ℹ️'
    }
  }

  const c = colors[type]

  return (
    <div style={{
      backgroundColor: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: c.text,
        fontSize: '0.9rem'
      }}>
        <span>{c.icon}</span>
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: c.text,
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: '0 0.25rem'
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

export function BackendOfflineBanner({
  show
}: BackendOfflineBannerProps) {
  if (!show) return null

  return (
    <ErrorBanner
      message="Backend is currently offline. Some features may be unavailable."
      type="warning"
    />
  )
}

export function LoadingSpinner({
  message = 'Loading...'
}: LoadingSpinnerProps) {
  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center',
      marginBottom: '1.5rem'
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.5rem',
        animation: 'pulse 1.2s infinite'
      }}>
        🧠
      </div>
      <p style={{ color: '#64748b' }}>
        {message}
      </p>
    </div>
  )
}
