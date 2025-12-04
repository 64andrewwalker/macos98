/**
 * Calculator App Manifest
 */

import type { AppManifest } from '../../app-framework'
import calculatorIcon from '../../assets/calculator.png'

export const calculatorManifest: AppManifest = {
  id: 'calculator',
  name: 'Calculator',
  version: '1.0.0',
  icon: calculatorIcon,
  window: {
    width: 200,
    height: 250,
    resizable: false
  }
}

