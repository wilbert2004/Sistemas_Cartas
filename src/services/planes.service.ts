//importamos el supebaseClientes.ts
import { supabase } from '@/lib/supabaseClient'

let missingEnvWarned = false

export const obtenerPlanes = async () => {
  if (!supabase) {
    if (!missingEnvWarned) {
      console.warn(
        'Faltan variables de entorno de Supabase. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
      )
      missingEnvWarned = true
    }
    return []
  }

  const { data, error } = await supabase
    .from('planes')
    .select('*')

  if (error) {
    console.error('Error al obtener planes:', error)
    throw error
  }

  return data
}

// prueba rápida (solo para testear)
obtenerPlanes().then((planes) => console.log('Planes:', planes))

