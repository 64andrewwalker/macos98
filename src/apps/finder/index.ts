/**
 * Finder App
 *
 * Exports the manifest and factory for registration with AppRuntime.
 */

import React from 'react'
import type { AppFactory, AppInstance, AppContext } from '../../app-framework'
import { finderManifest } from './manifest'
import { FinderView } from './FinderView'

export { finderManifest }

export interface FinderLaunchOptions {
  initialPath?: string
}

/**
 * Finder app factory
 */
export const createFinderApp: AppFactory = (ctx: AppContext): AppInstance => {
  return {
    onLaunch() {
      const initialPath = '/Users/default'

      // File system operations from scoped context
      const readdir = async (path: string) => {
        return ctx.fs.readdir(path)
      }

      const stat = async (path: string) => {
        return ctx.fs.stat(path)
      }

      // Handler for opening files
      const handleOpenFile = async (path: string) => {
        // Determine file type and open with appropriate app
        const ext = path.split('.').pop()?.toLowerCase()
        
        if (ext === 'txt' || ext === 'md' || ext === 'json') {
          // Read content and log for now
          // In a full implementation, this would request the AppRuntime to open the file
          try {
            const content = await ctx.fs.readTextFile(path)
            console.log('Opening file:', path, 'Content length:', content.length)
          } catch (err) {
            console.error('Failed to read file:', err)
          }
        } else {
          console.log('Unknown file type:', path)
        }
      }

      // Open the finder window
      ctx.openWindow({
        title: `${initialPath} - ${finderManifest.name}`,
        content: React.createElement(FinderView, {
          initialPath,
          onOpenFile: handleOpenFile,
          onNavigate: (path: string) => {
            console.log('Navigated to:', path)
          },
          readdir,
          stat
        }),
        width: finderManifest.window?.width ?? 600,
        height: finderManifest.window?.height ?? 400
      })
    },

    onMenuAction(action: string) {
      switch (action) {
        case 'file.newFolder':
          // Could prompt for folder name
          break
        case 'view.asIcons':
          // Could dispatch view mode change
          break
        case 'view.asList':
          // Could dispatch view mode change
          break
      }
    }
  }
}
