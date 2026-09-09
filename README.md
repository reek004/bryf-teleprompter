# bryf-teleprompter

A QuePrompter-style teleprompter that runs in the browser, tuned for **iPad Safari**.
No backend, no accounts — script and settings live in `localStorage`.

## Run

```bash
npm install
npm run dev        # binds 0.0.0.0; open http://<your-ip>:5173 on the iPad
npm run build      # static bundle in dist/
```

## Toolbar

| Control | What it does |
|---|---|
| grip | drag the whole bar between the top and bottom edge (remembered) |
| play / pause | start and stop the scroll |
| rewind | back to the first line |
| align | cycles left → center → right |
| mirror ⇄ | flips left/right for beamsplitter rigs |
| mirror ⇅ | flips top/bottom; scroll direction follows so text still reads forward |
| background / text color | 8 presets + native color picker |
| text size | 20–140px |
| margin | 0–40% of screen width per side |
| speed | 1–100, scaled by text size so a given number reads at the same pace |
| Import | opens a source sheet: device file picker, or Google Drive |
| pencil | type or paste a script directly |

## Import

**Import** opens a small sheet with two sources:

- **Upload from device** — the native file picker. On iPad this is the Files app,
  so iCloud Drive, Dropbox and the Google Drive app's file provider all work.
- **Upload from Google Drive** — the Google Picker, in-page. Hidden unless the
  build has Google credentials (see below). Picks `.docx` files and native
  Google Docs; a Google Doc is exported to `.docx` by Drive on the way in.

### Google Drive setup

Copy `.env.example` to `.env` and fill it in. In the
[Google Cloud console](https://console.cloud.google.com/):

1. Enable **Google Drive API** and **Google Picker API**.
2. Create an **API key** → `VITE_GOOGLE_API_KEY`. Restrict it to the Picker API.
3. Create an **OAuth client ID** of type *Web application* → `VITE_GOOGLE_CLIENT_ID`.
   Add every origin you serve from to *Authorised JavaScript origins*. Google only
   accepts `https://` public hostnames plus `http://localhost`, so a LAN address
   like `http://192.168.1.20:5173` is rejected — Drive import works on the deployed
   HTTPS origin and on localhost, and the device picker covers LAN testing.
4. Optionally add the project number as `VITE_GOOGLE_APP_ID`.

`VITE_*` values are inlined at build time, so set them before building and
rebuild after any change.

The OAuth scope is `drive.file`, the narrowest scope the Picker can grant: the
app only ever sees the one document you tapped, never the rest of the Drive.
Tokens are held in memory only — nothing about the Google account is persisted.

## Touch

- **Tap** the script — play / pause.
- **Drag up/down** — scroll the script, playing or paused. Auto-advance is held
  for the length of the drag and resumes from wherever you let go.
- **Flick** — a fast drag coasts on with momentum, like a normal scroller.
- **Wheel / trackpad** — scrolls too; auto-advance resumes once the wheel is idle.
- **Two-finger swipe** — jump one paragraph forward or back.
- Speed is the slider only.

Screen Wake Lock keeps the iPad awake while the script is rolling.

## Privacy policy

`public/privacy.html` is a standalone static page, copied verbatim into `dist/`
by Vite and served at `/privacy.html`. Google's OAuth consent screen requires a
public privacy policy URL before the app can be switched out of *Testing* into
external production, and that is the URL to give it.

## Notes

- `.docx` import keeps paragraphs, headings, bold and italic; everything else is
  stripped by DOMPurify before it is rendered.
- The pencil editor is plain text, so opening an imported script there and saving
  flattens its bold/italic.
- Google's picker and sign-in scripts load lazily, on the first tap of the Drive
  option, so a build without Drive configured never touches Google.
- Scrolling is `requestAnimationFrame` + `translate3d`, never `scrollTop` — iOS
  momentum scrolling fights a prompter.
