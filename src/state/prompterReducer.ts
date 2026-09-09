import type { Action, Align, PrompterState, Settings } from './types'

const ALIGN_CYCLE: Align[] = ['left', 'center', 'right']

export function prompterReducer(state: PrompterState, action: Action): PrompterState {
  switch (action.type) {
    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } as Settings }

    case 'CYCLE_ALIGN': {
      const next = ALIGN_CYCLE[(ALIGN_CYCLE.indexOf(state.settings.align) + 1) % ALIGN_CYCLE.length]
      return { ...state, settings: { ...state.settings, align: next } }
    }

    case 'TOGGLE_FLIP_X':
      return { ...state, settings: { ...state.settings, flipX: !state.settings.flipX } }

    case 'TOGGLE_FLIP_Y':
      return { ...state, settings: { ...state.settings, flipY: !state.settings.flipY } }

    case 'SET_SCRIPT':
      return {
        ...state,
        script: { html: action.html, name: action.name },
        playing: false,
      }

    case 'SET_PLAYING':
      return { ...state, playing: action.playing }

    case 'TOGGLE_PLAY':
      return { ...state, playing: !state.playing }

    case 'SET_EDITOR_OPEN':
      return { ...state, editorOpen: action.open, playing: action.open ? false : state.playing }

    case 'TOAST':
      return { ...state, toast: action.message }

    default:
      return state
  }
}
