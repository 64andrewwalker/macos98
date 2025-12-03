/**
 * Finder App Manifest
 */

import type { AppManifest } from '../../app-framework'

import folderIcon from '../../assets/folder_icon.png'

export const finderManifest: AppManifest = {
  id: 'finder',
  name: 'Finder',
  version: '1.0.0',
  icon: folderIcon,
  permissions: {
    fs: [
      { path: '/', mode: 'readwrite' }
    ],
    services: ['clipboard']
  },
  window: {
    width: 600,
    height: 400,
    minWidth: 400,
    minHeight: 300,
    resizable: true
  }
}
