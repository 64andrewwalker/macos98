/**
 * About App
 */

import React from 'react'
import type { AppFactory, AppInstance, AppContext } from '../../app-framework'
import { aboutManifest } from './manifest'
import { AboutView } from './AboutView'

export { aboutManifest }

/**
 * About app factory
 */
export const createAboutApp: AppFactory = (ctx: AppContext): AppInstance => {
  return {
    onLaunch() {
      ctx.openWindow({
        title: aboutManifest.name,
        content: React.createElement(AboutView),
        width: aboutManifest.window?.width ?? 300,
        height: aboutManifest.window?.height ?? 200
      })
    }
  }
}

