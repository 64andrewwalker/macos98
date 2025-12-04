/**
 * System Provider
 *
 * Provides system services to React components.
 */

import React, { useEffect, useState } from 'react'
import { initializeSystem, shutdownSystem, type SystemServices } from './bootstrap'
import { SystemContext } from './context'

export interface SystemProviderProps {
  children: React.ReactNode
}

/**
 * Provider that initializes the system and provides services
 */
export function SystemProvider({ children }: SystemProviderProps) {
  const [services, setServices] = useState<SystemServices | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    initializeSystem()
      .then((svc) => {
        if (mounted) {
          setServices(svc)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err)
        }
      })

    return () => {
      mounted = false
      shutdownSystem()
    }
  }, [])

  if (error) {
    return <div>System initialization failed: {error.message}</div>
  }

  if (!services) {
    return <div>Initializing system...</div>
  }

  return (
    <SystemContext.Provider value={services}>
      {children}
    </SystemContext.Provider>
  )
}
