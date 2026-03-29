'use client'

import { useEffect, useState } from 'react'

//importamos el planes.service.ts
import { obtenerPlanes } from '@/services/planes.service'

export default function Home() {
  const [planes, setPlanes] = useState<any[]>([])

  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerPlanes()
      setPlanes(data)
    }

    cargar()
  }, [])

  return (
    <div>
      <h1>Planes disponibles 🚀</h1>

      {planes.map((plan) => (
        <div key={plan.id}>
          <h2>{plan.nombre}</h2>
          <p>Precio: ${plan.precio}</p>
        </div>
      ))}
    </div>
  )
}