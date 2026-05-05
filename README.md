# Gabriel Barrera — About Me

Cyberpunk hacker-themed personal page. Drop these three files into the root of your `username.github.io` repo (or any GitHub Pages-enabled repo) and you're live.

## Files

- `index.html` — single self-contained page (React + components inlined)
- `styles.css` — all styling
- `headshot.png` — placeholder portrait. **Replace this** with your real photo (any aspect, ideally 4:5).

## Deploy

1. Create a repo named `<your-username>.github.io`
2. Drop `index.html`, `styles.css`, and `headshot.png` into the root
3. Push to `main`
4. In the repo: **Settings → Pages → Deploy from branch → main / root**
5. Visit `https://<your-username>.github.io`

That's it. No build step, no Node, no bundler — React and Babel load from a CDN at runtime.

## Customizing

- **Headshot**: replace `headshot.png` with your photo at the same filename
- **Copy / blurbs**: edit the `PILLARS` array near the top of the `<script>` block in `index.html`
- **Socials**: edit the `SOCIALS` array
- **Theme colors**: change `'--hue-a'` (accent / magenta) and `'--hue-b'` (secondary / cyan) in the `App` component — they're hue degrees, 0–360
