# Words Are Hard (Web)

A fast, silly party game for a group in one room. One phone is held up or passed around: tap the word to reveal the next one, describe or act it out without saying the obvious clues, and tap the player who guessed it to give them a point.

Plain HTML/CSS/JS — no framework, no build step, no backend. Installable as a PWA and playable offline once visited.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

`index.html` also works opened directly (`file://`); the service worker only registers over http(s).

## Add categories or items

Edit only `data/categories.js`:

```js
{ id: "food", name: "Food", icon: "🍕", items: ["Pizza", "Taco"] }
```

Then bump `CACHE_VERSION` in `service-worker.js` (e.g. `"v2"`) so already-installed copies refresh.

## Deploy (GitHub Pages)

1. Push this folder to a GitHub repo's `main` branch.
2. Repo **Settings → Pages** → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Open the published `https://<user>.github.io/<repo>/` URL. HTTPS makes the install prompt and offline mode work.

All paths are relative, so it works from a sub-path like `/<repo>/` with no changes.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Screens/markup, service worker registration |
| `style.css` | Styling, portrait + landscape layouts |
| `script.js` | Game logic and screen state machine |
| `data/categories.js` | Categories and word lists |
| `manifest.json`, `service-worker.js`, `icons/` | PWA install + offline |
