import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { loadState, saveState } from './persistence'
import { prompterReducer } from './prompterReducer'
import type { Action, PrompterState } from './types'

interface Ctx {
  state: PrompterState
  dispatch: Dispatch<Action>
}

const PrompterCtx = createContext<Ctx | null>(null)

export function PrompterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(prompterReducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state.settings, state.script])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <PrompterCtx.Provider value={value}>{children}</PrompterCtx.Provider>
}

export function usePrompter(): Ctx {
  const ctx = useContext(PrompterCtx)
  if (!ctx) throw new Error('usePrompter must be used inside <PrompterProvider>')
  return ctx
}
