/**
 * About App Manifest
 */

import type { AppManifest } from '../../app-framework'
import appleLogo from '../../assets/apple_logo.png'

export const aboutManifest: AppManifest = {
  id: 'about',
  name: 'About This Mac',
  version: '1.0.0',
  icon: appleLogo,
  window: {
    width: 300,
    height: 200,
    resizable: false
  }
}

