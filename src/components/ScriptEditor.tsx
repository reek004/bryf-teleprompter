import { useState } from 'react'
import { htmlToText, textToHtml } from '../lib/docx'
import { usePrompter } from '../state/PrompterContext'

export default function ScriptEditor() {
  const { state, dispatch } = usePrompter()
  const [text, setText] = useState(() => htmlToText(state.script.html))

  const close = () => dispatch({ type: 'SET_EDITOR_OPEN', open: false })

  const save = () => {
    const html = textToHtml(text)
    dispatch({
      type: 'SET_SCRIPT',
      html: html || '<p></p>',
      name: state.script.name || 'Untitled',
    })
    close()
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-neutral-950/95 backdrop-blur">
      <div
        className="flex items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <h1 className="truncate text-base font-medium text-neutral-100">
          {state.script.name || 'Untitled'}
        </h1>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={close}
            className="h-11 rounded-lg border border-neutral-600 px-4 text-sm text-neutral-200 active:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white active:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>

      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste your script. Leave a blank line between paragraphs."
        spellCheck={false}
        className="flex-1 resize-none bg-transparent p-4 text-base leading-relaxed text-neutral-100 outline-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      />
    </div>
  )
}
