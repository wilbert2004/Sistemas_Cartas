'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  sincronizarUsuarioAutenticado,
  sincronizarUsuarioGitHub,
} from '@/services/auth.service'

export const useDashboardGuard = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('Usuario')

  useEffect(() => {
    let activo = true

    const validarSesion = async () => {
      try {
        if (!supabase) {
          router.replace('/login')
          return
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error || !session?.user) {
          router.replace('/login')
          return
        }

        const user = session.user
        const sincronizadoGitHub = await sincronizarUsuarioGitHub(user)

        if (!sincronizadoGitHub) {
          await sincronizarUsuarioAutenticado(user)
        }

        if (activo) {
          setUserEmail(user.email ?? '')

          const metadata = user.user_metadata as Record<string, unknown> | null
          const nombre =
            (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) ||
            (typeof metadata?.name === 'string' && metadata.name.trim()) ||
            (typeof metadata?.user_name === 'string' && metadata.user_name.trim()) ||
            (user.email?.split('@')[0]?.trim() ?? 'Usuario')

          setUserName(nombre || 'Usuario')
        }
      } catch {
        router.replace('/login')
      } finally {
        if (activo) {
          setLoading(false)
        }
      }
    }

    validarSesion()

    return () => {
      activo = false
    }
  }, [router])

  return { loading, userEmail, userName }
}
