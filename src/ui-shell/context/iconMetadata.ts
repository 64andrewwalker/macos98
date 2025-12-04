/**
 * Icon Metadata Storage
 *
 * Stores legacy metadata for desktop icons that isn't part of the DesktopIcon type.
 * This includes the original icon IDs and file children for folders.
 */

import type { InitialFileItem } from '../../config/initialState'

/**
 * Storage for legacy data not supported by DesktopIcon type
 */
export const iconMetadata = new Map<string, { legacyId: string; children?: InitialFileItem[] }>()

