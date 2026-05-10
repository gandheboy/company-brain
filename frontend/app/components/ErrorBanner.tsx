'use client'
import { useState, useEffect } from 'react'

interface ErrorBannerProps {
  message?: string
  type?: 'error' | 'warning' | 'info'
  onDismiss?: () => void
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


interface BackendStatusProps {
  show: boolean
}

export function BackendOfflineBanner({ show }: BackendStatusProps) {
  if (!show) return null

  return (
    <div style={{
      backgroundColor: '#1c1400',
      border: '1px solid #d97706',
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1rem'
    }}>
      <span>⚠️</span>
      <div>
        <div style={{
          color: '#fcd34d',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          Backend is offline
        </div>
        <div style={{
          color: '#92400e',
          fontSize: '0.8rem',
          marginTop: '0.2rem'
        }}>
          Start the backend:
          <code style={{
            backgroundColor: '#292524',
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
            marginLeft: '0.4rem',
            fontFamily: 'monospace'
          }}>
            cd backend && python -m uvicorn app.main:app --reload --port 8000
          </code>
        </div>
      </div>
    </div>
  )
}


export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      color: '#64748b',
      gap: '1rem'
    }}>
      <div style={{
        fontSize: '2.5rem',
        animation: 'spin 2s linear infinite'
      }}>
        🧠
      </div>
      <p style={{ fontSize: '0.9rem' }}>{message}</p>
    </div>
  )
}


export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel
}: {
  icon: string
  title: string
  description: string
  action?: () => void
  actionLabel?: string
}) {
  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      padding: '3rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '3rem',
        marginBottom: '1rem'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
      }}>
        {title}
      </h3>
      <p style={{
        color: '#64748b',
        fontSize: '0.9rem',
        marginBottom: action ? '1.5rem' : '0'
      }}>
        {description}
      </p>
      {action && actionLabel && (
        <button
          onClick={action}
          style={{
            padding: '0.6rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}