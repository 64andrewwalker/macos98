/**
 * Desktop Module - UI Shell Layer
 */

export { createDesktopService } from './desktop-service'
export {
  saveDesktopSettings,
  loadDesktopSettings,
  clearDesktopSettings,
  type DesktopSettings
} from './desktop-persistence'
export type {
  DesktopService,
  DesktopServiceOptions,
  DesktopIcon,
  IconPosition,
  IconTarget,
  IconTargetType,
  DesktopState,
  DesktopEvent,
  DesktopEventType,
  DesktopChangeCallback,
  IconDoubleClickCallback,
  ContextMenuCallback
} from './types'

