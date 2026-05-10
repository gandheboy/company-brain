'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      // Get the session after email verification
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/auth')
        return
      }

      const user = session.user

      // Check if this is a NEW user
      // New user = account created less than 1 minute ago
      const createdAt = new Date(user.created_at).getTime()
      const now = Date.now()
      const isNewUser = (now - createdAt) < 60000

      if (isNewUser) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          🧠
        </div>
        <p style={{ color: '#64748b' }}>
          Verifying your account...
        </p>
      </div>
    </div>
  )
}