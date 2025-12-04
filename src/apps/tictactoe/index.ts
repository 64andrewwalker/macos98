/**
 * TicTacToe App
 */

import React from 'react'
import type { AppFactory, AppInstance, AppContext } from '../../app-framework'
import { tictactoeManifest } from './manifest'
import { TicTacToeView } from './TicTacToeView'

export { tictactoeManifest }

/**
 * TicTacToe app factory
 */
export const createTicTacToeApp: AppFactory = (ctx: AppContext): AppInstance => {
  return {
    onLaunch() {
      ctx.openWindow({
        title: tictactoeManifest.name,
        content: React.createElement(TicTacToeView),
        width: tictactoeManifest.window?.width ?? 200,
        height: tictactoeManifest.window?.height ?? 250
      })
    }
  }
}

