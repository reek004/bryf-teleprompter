export type Align = 'left' | 'center' | 'right'
export type ToolbarSide = 'top' | 'bottom'

export interface Settings {
  /** px */
  fontSize: number
  /** % of viewport width, per side */
  margin: number
  /** 1-100, mapped to px/sec in the scroll engine */
  speed: number
  align: Align
  /** mirror left <-> right (beamsplitter rigs) */
  flipX: boolean
  /** mirror top <-> bottom */
  flipY: boolean
  bgColor: string
  textColor: string
  lineHeight: number
  toolbarSide: ToolbarSide
}

export interface ScriptDoc {
  /** sanitized HTML; plain text is wrapped into <p> */
  html: string
  name: string
}

export interface PrompterState {
  settings: Settings
  script: ScriptDoc
  playing: boolean
  editorOpen: boolean
  toast: string | null
}

export type Action =
  | { type: 'SET_SETTING'; key: keyof Settings; value: Settings[keyof Settings] }
  | { type: 'CYCLE_ALIGN' }
  | { type: 'TOGGLE_FLIP_X' }
  | { type: 'TOGGLE_FLIP_Y' }
  | { type: 'SET_SCRIPT'; html: string; name: string }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_EDITOR_OPEN'; open: boolean }
  | { type: 'TOAST'; message: string | null }
