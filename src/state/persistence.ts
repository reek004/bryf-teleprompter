import { DEFAULT_SETTINGS, SAMPLE_SCRIPT } from './defaults'
import type { PrompterState, ScriptDoc, Settings } from './types'

const KEY = 'bryf-teleprompter/v1'

interface Persisted {
  settings: Partial<Settings>
  script: ScriptDoc
}

export function loadState(): PrompterState {
  const base: PrompterState = {
    settings: DEFAULT_SETTINGS,
    script: SAMPLE_SCRIPT,
    playing: false,
    editorOpen: false,
    toast: null,
  }

  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      ...base,
      // merge over defaults so settings added later don't break stored blobs
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      script: parsed.script?.html ? parsed.script : base.script,
    }
  } catch {
    return base
  }
}

let timer: number | undefined

export function saveState(state: PrompterState): void {
  if (timer !== undefined) clearTimeout(timer)
  timer = window.setTimeout(() => {
    const payload: Persisted = { settings: state.settings, script: state.script }
    try {
      localStorage.setItem(KEY, JSON.stringify(payload))
    } catch {
      // quota exceeded / private mode - not worth interrupting the operator
    }
  }, 300)
}
