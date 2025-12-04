/**
 * System Context
 */

import { createContext } from 'react'
import type { SystemServices } from './bootstrap'

export const SystemContext = createContext<SystemServices | null>(null)

