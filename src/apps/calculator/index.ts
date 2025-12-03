/**
 * Calculator App
 *
 * Exports the manifest and factory for registration with AppRuntime.
 */

import React from 'react'
import type { AppFactory, AppInstance, AppContext } from '../../app-framework'
import { calculatorManifest } from './manifest'
import { CalculatorView } from './CalculatorView'

export { calculatorManifest }

/**
 * Calculator app factory
 */
export const createCalculatorApp: AppFactory = (ctx: AppContext): AppInstance => {
  return {
    onLaunch() {
      // Open the calculator window
      ctx.openWindow({
        title: calculatorManifest.name,
        content: React.createElement(CalculatorView),
        width: calculatorManifest.window?.width ?? 200,
        height: calculatorManifest.window?.height ?? 300
      })
    },

    onMenuAction(action: string) {
      switch (action) {
        case 'edit.clear':
          // Could dispatch a clear event if needed
          break
      }
    }
  }
}

