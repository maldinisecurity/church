# Projector Bible

Projector-first Bible app using the free `bible-api.com` service.

## Features

- Operator-side preview before going live
- Dedicated projector window that updates only when you send
- Large verse-by-verse slides for projection
- Keyboard navigation with left/right arrows
- Send current preview with `Enter`
- Hideable control panel for a cleaner screen
- Adjustable text size
- High-contrast mode
- Public-domain translation support through the API

## Run

Because the app fetches a remote API, serve the folder with a local web server instead of opening `index.html` directly.

Example:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Workflow

1. Open the app in your operator laptop browser.
2. Click `Open Projector` to launch the dedicated live screen.
3. Search and preview verses on the operator screen.
4. Press `Send To Projector` or `Enter` when you want the current preview verse to go live.

The projector screen can also be opened directly with:

```text
http://127.0.0.1:4173/?screen=projector
```

## Shortcuts

- `Left Arrow`: previous preview verse
- `Right Arrow`: next preview verse
- `Enter`: send current preview to projector
- `F`: toggle fullscreen in the current window
- `H`: hide/show controls
