# TrigLoop

**TrigLoop** is a modern, gamified unit-circle trainer built as a fully static website. It is designed for students learning trigonometry and can be hosted directly on **GitHub Pages** with no server, database, build step, or API key.

## What it does

- Interactive unit circle with the 16 standard angles
- Degrees ↔ radians
- Exact coordinates, sine, cosine, and tangent values
- Reference angles and quadrant information
- Pattern-based learning tips
- Four game modes:
  - **Angle Dash** — locate angles on the circle under a 60-second timer
  - **Value Vault** — recall exact trig values
  - **Coordinate Clash** — match angles to `(cos θ, sin θ)`
  - **Sign Sprint** — practice quadrant sign patterns
- Streaks, combo scoring, XP, levels, high scores, accuracy tracking
- Sound effects using the browser's Web Audio API
- Local progress saving with `localStorage`
- Responsive design for desktop, tablet, and phone
- Reduced-motion accessibility support

## Project structure

```text
trigloop/
├── index.html
├── styles.css
├── app.js
├── .nojekyll
├── README.md
└── assets/
    └── favicon.svg
```

## Run it locally

Because this project is completely static, you can open `index.html` directly in a browser.

For a local server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Publish on GitHub Pages

1. Create a repository named **`trigloop`**.
2. Upload all files in this project to the repository root.
3. Push/commit the files.
4. On GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
6. Save.

GitHub will provide a public URL similar to:

```text
https://YOUR-USERNAME.github.io/trigloop/
```

No code changes are required for project-page hosting because all paths are relative.

## Tech

- Semantic HTML
- Modern CSS
- SVG
- Vanilla JavaScript
- LocalStorage
- Web Audio API

## Notes

The Google Font import in `styles.css` is optional. If the browser cannot reach Google Fonts, the site falls back to system fonts and remains fully functional.