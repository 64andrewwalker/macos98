/**
 * TextEditor App
 *
 * Exports the manifest and factory for registration with AppRuntime.
 */

import React from 'react'
import type { AppFactory, AppInstance, AppContext } from '../../app-framework'
import { textEditorManifest } from './manifest'
import { TextEditorView } from './TextEditorView'

export { textEditorManifest }

export interface TextEditorLaunchOptions {
  filePath?: string
  initialContent?: string
}

/**
 * TextEditor app factory
 */
export const createTextEditorApp: AppFactory = (ctx: AppContext): AppInstance => {
  let currentFilePath: string | undefined

  return {
    onLaunch() {
      // Open with empty content by default
      openEditor(ctx, undefined, '')
    },

    openFile(path: string) {
      // Read file content and open editor
      ctx.fs.readTextFile(path)
        .then(content => {
          openEditor(ctx, path, content)
        })
        .catch(err => {
          console.error('Failed to open file:', err)
        })
    },

    onMenuAction(action: string) {
      switch (action) {
        case 'file.new':
          openEditor(ctx, undefined, '')
          break
        case 'file.save':
          // Could dispatch a save event to the component
          break
      }
    }
  }

  function openEditor(ctx: AppContext, filePath: string | undefined, content: string) {
    currentFilePath = filePath

    // Define save handler that uses scoped file system
    const handleSave = async (newContent: string) => {
      if (!currentFilePath) {
        // For new files, create in user's Documents folder
        currentFilePath = `/Users/default/Documents/Untitled-${Date.now()}.txt`
      }
      await ctx.fs.writeFile(currentFilePath, newContent)
    }

    // Open the text editor window
    ctx.openWindow({
      title: currentFilePath 
        ? `${currentFilePath.split('/').pop()} - ${textEditorManifest.name}` 
        : `Untitled - ${textEditorManifest.name}`,
      content: React.createElement(TextEditorView, {
        filePath: currentFilePath,
        initialContent: content,
        onSave: handleSave
      }),
      width: textEditorManifest.window?.width ?? 600,
      height: textEditorManifest.window?.height ?? 450
    })
  }
}
