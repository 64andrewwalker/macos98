/**
 * Background Switcher App
 */

import React from 'react'
import type { AppFactory, AppInstance, AppContext } from '../../app-framework'
import { backgroundSwitcherManifest } from './manifest'
import { BackgroundSwitcherView } from './BackgroundSwitcherView'

export { backgroundSwitcherManifest }

/**
 * Background Switcher app factory
 */
export const createBackgroundSwitcherApp: AppFactory = (ctx: AppContext): AppInstance => {
  return {
    onLaunch() {
      ctx.openWindow({
        title: backgroundSwitcherManifest.name,
        content: React.createElement(BackgroundSwitcherView),
        width: backgroundSwitcherManifest.window?.width ?? 600,
        height: backgroundSwitcherManifest.window?.height ?? 500
      })
    }
  }
}

