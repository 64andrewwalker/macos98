/**
 * TextEditor App Manifest
 */

import type { AppManifest } from '../../app-framework'

export const textEditorManifest: AppManifest = {
  id: 'text-editor',
  name: 'SimpleText',
  version: '1.0.0',
  icon: '/icons/text-editor.png',
  permissions: {
    fs: [
      { path: '/Users', mode: 'readwrite' },
      { path: '/Applications', mode: 'read' },
      { path: '/System', mode: 'read' }
    ],
    services: ['clipboard']
  },
  window: {
    width: 600,
    height: 450,
    minWidth: 400,
    minHeight: 300,
    resizable: true
  },
  fileAssociations: [
    { extensions: ['.txt'], mimeTypes: ['text/plain'], role: 'editor' },
    { extensions: ['.md'], mimeTypes: ['text/markdown'], role: 'editor' },
    { extensions: ['.json'], mimeTypes: ['application/json'], role: 'editor' }
  ]
}
