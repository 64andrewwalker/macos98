/**
 * Apps Index
 *
 * Exports all app manifests and factories.
 * Used to register apps with the AppRuntime.
 */

// Calculator
export { calculatorManifest, createCalculatorApp } from './calculator'

// TicTacToe
export { tictactoeManifest, createTicTacToeApp } from './tictactoe'

// About
export { aboutManifest, createAboutApp } from './about'

// Background Switcher
export { backgroundSwitcherManifest, createBackgroundSwitcherApp } from './background-switcher'

// TextEditor
export { textEditorManifest, createTextEditorApp } from './text-editor'

// Finder
export { finderManifest, createFinderApp } from './finder'

// All manifests for easy iteration
import { calculatorManifest } from './calculator'
import { tictactoeManifest } from './tictactoe'
import { aboutManifest } from './about'
import { backgroundSwitcherManifest } from './background-switcher'
import { textEditorManifest } from './text-editor'
import { finderManifest } from './finder'
import type { AppManifest, AppFactory } from '../app-framework'

export interface AppRegistration {
  manifest: AppManifest
  factory: AppFactory
}

import { createCalculatorApp } from './calculator'
import { createTicTacToeApp } from './tictactoe'
import { createAboutApp } from './about'
import { createBackgroundSwitcherApp } from './background-switcher'
import { createTextEditorApp } from './text-editor'
import { createFinderApp } from './finder'

/**
 * All registered apps
 */
export const allApps: AppRegistration[] = [
  { manifest: calculatorManifest, factory: createCalculatorApp },
  { manifest: tictactoeManifest, factory: createTicTacToeApp },
  { manifest: aboutManifest, factory: createAboutApp },
  { manifest: backgroundSwitcherManifest, factory: createBackgroundSwitcherApp },
  { manifest: textEditorManifest, factory: createTextEditorApp },
  { manifest: finderManifest, factory: createFinderApp }
]

/**
 * Get app registration by ID
 */
export function getAppById(appId: string): AppRegistration | undefined {
  return allApps.find(app => app.manifest.id === appId)
}
