'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

const supabase = createClient()

export default function LogoutButton({ label = 'Logout' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setLoading(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setLoading(false)
      return
    }

    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px 10px',
        color: '#e53e3e',
        backgroundColor: '#fff5f5',
        border: 0,
        borderRadius: '6px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        opacity: loading ? 0.7 : 1,
      }}
    >
      <span>🚪</span>
      {loading ? `${label}...` : label}
    </button>
  )
}
