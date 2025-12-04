/**
 * Background Switcher App Manifest
 */

import type { AppManifest } from '../../app-framework'
// Using a generic icon for now
import folderIcon from '../../assets/folder_icon.png'

export const backgroundSwitcherManifest: AppManifest = {
  id: 'background-switcher',
  name: 'Change Background',
  version: '1.0.0',
  icon: folderIcon,
  permissions: {
    services: ['desktop']
  },
  window: {
    width: 600,
    height: 500,
    resizable: true
  }
}

