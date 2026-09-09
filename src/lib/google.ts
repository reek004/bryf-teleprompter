/**
 * Google Drive picking, kept behind two env vars so the app still builds and
 * runs with no Google project at all - the Drive button just hides.
 *
 * Scope is drive.file (per-file consent), which is the narrowest scope the
 * Picker can grant: the app only ever sees the document you tapped.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID as string | undefined

const SCOPE = 'https://www.googleapis.com/auth/drive.file'

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const GDOC_MIME = 'application/vnd.google-apps.document'

// APP_ID is not optional: with the drive.file scope, the Picker only registers
// per-file access against the project whose number it is given, so a picker
// built without setAppId hands back a file the app is then not allowed to read.
export const driveConfigured = Boolean(CLIENT_ID && API_KEY && APP_ID)

export class DriveError extends Error {}

/* -------------------------------------------------------------- script tags */

const scripts = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  const cached = scripts.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      scripts.delete(src)
      reject(new DriveError('Could not reach Google. Check the connection.'))
    }
    document.head.appendChild(el)
  })

  scripts.set(src, promise)
  return promise
}

/* ------------------------------------------------------------------- typings */

interface PickedDoc {
  id: string
  name: string
  mimeType: string
}

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void
}

// The Google scripts are loaded at runtime, so they are typed only as far as
// this file needs them.
interface GoogleGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
        error_callback?: (error: { type?: string }) => void
      }) => TokenClient
    }
  }
  picker: any
}

declare global {
  // eslint-disable-next-line no-var
  var google: GoogleGlobal | undefined
  // eslint-disable-next-line no-var
  var gapi: { load: (name: string, cb: () => void) => void } | undefined
}

/* --------------------------------------------------------------------- token */

let tokenClient: TokenClient | null = null
let pending: {
  resolve: (token: string) => void
  reject: (err: Error) => void
} | null = null

let cachedToken: { value: string; expiresAt: number } | null = null

const settle = (fn: (p: NonNullable<typeof pending>) => void) => {
  const p = pending
  pending = null
  if (p) fn(p)
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  await loadScript('https://accounts.google.com/gsi/client')
  const oauth2 = globalThis.google?.accounts?.oauth2
  if (!oauth2) throw new DriveError('Google sign-in failed to load.')

  if (!tokenClient) {
    tokenClient = oauth2.initTokenClient({
      client_id: CLIENT_ID!,
      scope: SCOPE,
      callback: (response) => {
        if (!response.access_token) {
          settle((p) =>
            p.reject(new DriveError(response.error ?? 'Google sign-in was cancelled.')),
          )
          return
        }
        cachedToken = {
          value: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        }
        settle((p) => p.resolve(response.access_token!))
      },
      error_callback: () =>
        settle((p) => p.reject(new DriveError('Google sign-in was cancelled.'))),
    })
  }

  return new Promise<string>((resolve, reject) => {
    // Only one consent flow can be in flight; a second tap replaces the first.
    settle((p) => p.reject(new DriveError('Google sign-in was cancelled.')))
    pending = { resolve, reject }
    tokenClient!.requestAccessToken()
  })
}

/* -------------------------------------------------------------------- picker */

async function loadPicker(): Promise<void> {
  await loadScript('https://apis.google.com/js/api.js')
  if (globalThis.google?.picker) return
  await new Promise<void>((resolve, reject) => {
    const gapi = globalThis.gapi
    if (!gapi) {
      reject(new DriveError('Google Drive failed to load.'))
      return
    }
    gapi.load('picker', () => resolve())
  })
}

/** Opens the Drive picker. Resolves to null when the user backs out. */
async function pickDocument(token: string): Promise<PickedDoc | null> {
  await loadPicker()
  const picker = globalThis.google?.picker
  if (!picker) throw new DriveError('Google Drive failed to load.')

  return new Promise<PickedDoc | null>((resolve) => {
    const view = new picker.DocsView(picker.ViewId.DOCS)
      .setMimeTypes(`${DOCX_MIME},${GDOC_MIME}`)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)

    const builder = new picker.PickerBuilder()
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY!)
      .setTitle('Choose a script')
      .addView(view)
      // The prompter runs full-screen on an iPad; the picker should too.
      .enableFeature(picker.Feature.NAV_HIDDEN)
      .setCallback((data: any) => {
        if (data.action === picker.Action.PICKED) {
          const doc = data.docs?.[0]
          resolve(
            doc
              ? { id: doc.id, name: doc.name, mimeType: doc.mimeType }
              : null,
          )
        } else if (data.action === picker.Action.CANCEL) {
          resolve(null)
        }
      })

    builder.setAppId(APP_ID!)
    builder.build().setVisible(true)
  })
}

/* ------------------------------------------------------------------ download */

/** Drive's error bodies are JSON; pull the human-readable reason out of one. */
async function driveReason(res: Response): Promise<string> {
  try {
    const body = await res.json()
    const message = body?.error?.message
    if (typeof message === 'string' && message) return message
  } catch {
    // Not JSON, or already consumed - fall through to the status line.
  }
  return `${res.status} ${res.statusText}`.trim()
}

async function download(doc: PickedDoc, token: string): Promise<Blob> {
  // Native Google Docs have no bytes of their own - ask Drive to export .docx.
  const base = `https://www.googleapis.com/drive/v3/files/${doc.id}`
  const url =
    doc.mimeType === GDOC_MIME
      ? `${base}/export?mimeType=${encodeURIComponent(DOCX_MIME)}&supportsAllDrives=true`
      : `${base}?alt=media&supportsAllDrives=true`

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const reason = await driveReason(res)
    // 403/404 here almost always means the drive.file grant never landed: the
    // token is fine (the picker used it), the app just was not given this file.
    const hint =
      res.status === 404 || res.status === 403
        ? ' Drive did not grant this build access to the file - check that VITE_GOOGLE_APP_ID is the project number of the same project as the OAuth client.'
        : ''
    throw new DriveError(
      `Could not download "${doc.name}" from Drive: ${reason}.${hint}`,
    )
  }
  return res.blob()
}

/**
 * Sign in, pick, download. Resolves to null if the user cancels either step,
 * so callers can treat cancellation as a no-op rather than an error.
 */
export async function pickFromDrive(): Promise<File | null> {
  if (!driveConfigured) {
    throw new DriveError('Google Drive is not configured for this build.')
  }

  const token = await getAccessToken()
  const doc = await pickDocument(token)
  if (!doc) return null

  const blob = await download(doc, token)
  const name = doc.mimeType === GDOC_MIME ? `${doc.name}.docx` : doc.name
  return new File([blob], name, { type: DOCX_MIME })
}
