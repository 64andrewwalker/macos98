/**
 * TicTacToe App Manifest
 */

import type { AppManifest } from '../../app-framework'
import joystickIcon from '../../assets/joystick.png'

export const tictactoeManifest: AppManifest = {
  id: 'tictactoe',
  name: 'TicTacToe',
  version: '1.0.0',
  icon: joystickIcon,
  window: {
    width: 200,
    height: 250,
    resizable: false
  }
}

