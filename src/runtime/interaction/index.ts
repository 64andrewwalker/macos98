/**
 * Interaction Runtime Layer
 *
 * Centralizes OS9-authentic interaction patterns as reusable hooks and providers.
 * Turns behavioral rules from INTERACTION_BLUEPRINT.md into testable TypeScript primitives.
 *
 * @see INTERACTION_BLUEPRINT.md - Layer 7: Interaction Patterns
 * @see openspec/changes/add-interaction-runtime-layer
 */

// Title Bar Interaction
export {
  useTitleBarInteraction,
  type TitleBarInteractionOptions,
  type TitleBarInteractionResult
} from './titleBar'

// Button State Machine
export {
  useButtonStateMachine,
  type ButtonStateMachineOptions,
  type ButtonState,
  type ButtonStateMachineResult
} from './buttonState'

// Window Focus Manager
export {
  WindowManagerProvider,
  useWindowRegistration,
  type WindowManagerProviderProps,
  type WindowRegistrationResult
} from './windowManager'

// Menu Mode Engine
export {
  MenuModeProvider,
  useMenuMode,
  type MenuModeProviderProps,
  type UseMenuModeResult
} from './menuMode'

// Finder Selection Engine
export {
  useFinderSelection,
  type SelectionModel,
  type SelectionItem,
  type ItemSelectionProps,
  type FinderSelectionResult
} from './finderSelection'
