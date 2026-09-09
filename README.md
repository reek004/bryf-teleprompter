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
| Import | `.docx` via mammoth (opens the Files app on iPad) |
| pencil | type or paste a script directly |

## Touch

- **Tap** the script — play / pause.
- **Drag up/down** — scroll the script, playing or paused. Auto-advance is held
  for the length of the drag and resumes from wherever you let go.
- **Flick** — a fast drag coasts on with momentum, like a normal scroller.
- **Wheel / trackpad** — scrolls too; auto-advance resumes once the wheel is idle.
- **Two-finger swipe** — jump one paragraph forward or back.
- Speed is the slider only.

Screen Wake Lock keeps the iPad awake while the script is rolling.

## Notes

- `.docx` import keeps paragraphs, headings, bold and italic; everything else is
  stripped by DOMPurify before it is rendered.
- The pencil editor is plain text, so opening an imported script there and saving
  flattens its bold/italic.
- Scrolling is `requestAnimationFrame` + `translate3d`, never `scrollTop` — iOS
  momentum scrolling fights a prompter.
