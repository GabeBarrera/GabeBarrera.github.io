# gabriel.barrera_ — Interactive Portfolio

A single-page personal portfolio for **Gabe Barrera**, Information Security Analyst. The site is built as a macOS-style "Exposé" desktop: five panels that you fan out and tab between using the native View Transitions API — no framework, no build step.

🔗 **[github.com/GabeBarrera](https://github.com/GabeBarrera)**

---

## Sections

| Panel | What it is |
|-------|------------|
| **Home** | Looping video background with a typed-text "Hacker Poet" intro and avatar. |
| **Projects** | A working terminal emulator — type commands to explore. |
| **Contact** | An iOS-Contacts-style card with tap-to-email, confirm-before-dial, and social links. |
| **Career** | An interactive [Leaflet](https://leafletjs.com/) map plotting school and work history, with a Timeline / Interactive toggle and a detail sidebar. |
| **Resume** | An in-page PDF viewer rendering a styled résumé, with zoom, print, and download. |

## Features

- **Exposé navigation** — sections animate in and out with `document.startViewTransition()` and a `popover` menu.
- **Confirm-before-dial** — phone links prompt before opening the dialer.
- **No build tooling** — plain HTML, CSS, and vanilla JavaScript.
- **Self-hosted assets** — images, video, and the résumé PDF live under `assets/`.

## Tech

- HTML / CSS / vanilla JavaScript
- [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) + the Popover API
- [Leaflet 1.9.4](https://leafletjs.com/) for the career map
- Google Fonts: Space Grotesk, IBM Plex Sans/Mono, JetBrains Mono

> **Note:** View Transitions and Popover require a modern Chromium-based browser for the full experience.

## Project structure

```
.
├── index.html            # All five sections
├── src/
│   ├── style.css         # Styles
│   └── script.js         # Navigation, terminal, career map, PDF viewer
└── assets/
    ├── images/           # Avatars, logo, contact photo
    ├── video/            # Home background loop
    └── documents/        # Résumé PDF
```

## Running locally

No build step. Serve the folder over HTTP so the video, map, and PDF load correctly:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000`.

---

© 2026 — Gabriel Barrera // resume.log
