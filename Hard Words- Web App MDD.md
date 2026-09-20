# Words Are Hard - Web App MDD

2026-09-20 · @Someone

A lightweight, single-page HTML/JavaScript party game modeled on "Words Are Hard," built by Claude Code and deployed as a static site via a Git repo (e.g. GitHub Pages) so anyone can play it in a browser.

## 1. Overview & Objective

**Working title:** Words Are Hard (Web)

**Elevator pitch:** A fast, silly party game for a group in one room. One phone or tablet is held up or passed around; the active player (or team) taps the screen to reveal a new object/word from a chosen category and must describe or act it out without saying certain obvious things, while teammates guess. Judges or opposing players tap the left/right edges of the screen to award a point to whichever side/team got it right (or to mark pass/skip), then the game keeps revealing new items until the player taps end or time runs out.

**Primary objective:** Ship a single, self-contained web app (HTML/CSS/JS, no backend, no build tooling required) that Claude Code can generate, commit to a Git repo, and have live on a static host (e.g. GitHub Pages) within one deploy cycle. Anyone with the URL can play immediately on desktop or mobile browser — no install, no login, no server.

**Target platform:** Mobile-first responsive web (played mostly on a phone/tablet passed around a group), also usable on desktop/laptop browsers.

**Out of scope for v1:** accounts, multiplayer over network, backend/database, native app builds. (See Future Enhancements.)

## 2. Core Gameplay Loop

1. **Landing / Main Menu** — Player sees the game title and a "Play" button (plus "How to Play" entry point).
2. **Player Setup** — Add players (2 or more, no upper limit beyond what fits on screen — practically supports large groups). Each player gets a name and an auto-assigned color/avatar. "Continue" is disabled until at least 2 players are added.
3. **Category Select** — Player picks one or more categories (Everyday Items, Holiday, Vacation, Unique/Random, etc.) from a grid of tappable cards. A "Mixed / All" option shuffles across every selected category. "Start Round" begins play immediately (no separate timer/setup step).
4. **Play Screen** — The core loop:

- A large central tap zone shows one object/word at a time (text and/or emoji/icon).
- **Tapping the center** advances to the next random item from the selected category pool (no repeats until the pool is exhausted, then reshuffle).
- Below (or beside, in landscape) the reveal zone sits a row/grid of **player chips**, one per player, each showing that player's name and running score.
- **Tapping a player's chip** awards that player a point for the current item and immediately advances to the next item — this is how any number of players (not just two sides) gets scored.
- This repeats continuously — tap to reveal, guess, tap the scoring player, repeat — for as long as the group keeps playing.

5. **Round End** — The player/host taps "End Round" whenever they're done. Show a summary screen ranking every player by score.

The center reveal tap and the per-player scoring tap are the two core interactions and must never require more than a single tap each — the game should feel instant and frictionless since it's played live, out loud.

## 3. Categories & Content Model

**v1 built-in categories:**

| Category | Example items |
| --- | --- |
| Everyday Items | toothbrush, umbrella, stapler, remote control, backpack |
| Holiday | Christmas tree, fireworks, jack-o-lantern, menorah, turkey |
| Vacation | passport, sunscreen, suitcase, beach towel, boarding pass |
| Unique / Wildcard | disco ball, time machine, rubber chicken, lava lamp |

Each category needs roughly 40–75 items at launch so a round doesn't repeat too quickly; more can be added later purely by editing the data file (no code changes).

**Selection rules:**

- Player can pick exactly one category, or an "All / Mixed" toggle that pools every category together.
- Item order within the active pool is shuffled at round start; the pool reshuffles (with a no-immediate-repeat guard) once exhausted so a long round never runs dry.
- Category list itself is data-driven (see Data Model) so adding a new category is a content change, not a code change.

## 4. Screens & UI

**A. Main Menu**

- Game title/logo, tagline, big "Play" button, secondary "How to Play" link, and an install prompt hint when the browser's PWA install is available.

**B. Player Setup**

- Text input + "Add Player" button, list of added players (name + auto-color chip, each removable), "Continue" button (disabled until at least 2 players).

**C. Category Select**

- Grid of category cards (icon + name), tap to select (single-select or multi-select toggle), "All/Mixed" option, "Start Round" button (disabled until at least one category chosen). No timer/round-setup step — starting goes straight to the Play Screen.

**D. Play Screen (core screen)**

- Full-viewport layout, two zones:
- Top/center reveal zone (majority of the screen) — large item text/emoji, tap anywhere here to cycle to the next item.
- Bottom scoring bar — a horizontally scrollable (if needed) row of player chips, each showing name + running score; tapping a chip awards that player a point.
- Top bar: current category label, "End Round" button.
- Brief (150–250ms) visual pulse/flash on tap so it's obvious a tap registered — critical since this is played fast and out loud.

**E. Round Summary**

- All players ranked by final score (winner highlighted), "Play Again" (same players & categories) and "Back to Menu" buttons.

Layout must work in both portrait and landscape, and the player scoring bar must stay usable with many players (wrap or scroll rather than shrinking chips past a tappable size).

## 5. Technical Architecture

- **Stack:** Plain HTML5 + CSS3 + vanilla JavaScript. No framework, no bundler, no npm build step required — keeps the deploy path as simple as "push to the repo, host serves the files."
- **Rendering:** Single-page app with JS-driven screen switching (show/hide `<section>` elements or a tiny state machine) rather than multi-page navigation, so there's no reload flicker mid-game.
- **State management:** A small in-memory JS object holds current screen, player list + scores, selected category/categories, and the shuffled item queue. No backend, no database — game state resets on "Back to Menu" by design.
- **Persistence (optional, nice-to-have):** `localStorage` can remember the last-used player names and categories between visits, but is not required for core gameplay.
- **PWA support (v1 requirement):**
- `manifest.json` (name, short_name, icons at 192px/512px, `start_url`, `display: standalone`, theme/background colors) so the app is installable to a home screen.
- A service worker (`service-worker.js`) registered from `index.html` that caches the app shell (HTML/CSS/JS/data/icons) on install and serves from cache first, so the game works offline once installed/visited.
- Must pass basic installability checks (served over HTTPS — GitHub Pages provides this — valid manifest, registered service worker) so browsers show an "Add to Home Screen"/install prompt.
- **Assets:** Category items are text + optional emoji, so no large image assets are required, keeping the app tiny, fast to load, and easy to cache offline. App icons for the manifest are the one required image asset.
- **Responsiveness:** CSS flexbox/grid with relative units (%, vh/vw) and touch-friendly hit targets (min ~48px). Must support touch (`pointerdown`/`click`) and mouse for desktop testing.
- **Browser support target:** Latest 2 versions of Chrome, Safari (iOS), Firefox, Edge — this is what most players will open the link on a phone, and what needs to support the install prompt.

## 6. Data Model

Categories and items live in a single JS/JSON data file so content can be edited or expanded without touching game logic. Players are runtime state, not fixed content, since any number can be added per game:

```json
{
 "categories": [
 {
 "id": "everyday",
 "name": "Everyday Items",
 "icon": "\ud83d\udc5c",
 "items": ["Toothbrush", "Umbrella", "Stapler", "Remote Control", "Backpack"]
 },
 {
 "id": "holiday",
 "name": "Holiday",
 "icon": "\ud83c\udf84",
 "items": ["Christmas Tree", "Fireworks", "Jack-o-Lantern", "Menorah", "Turkey"]
 },
 {
 "id": "vacation",
 "name": "Vacation",
 "icon": "\u2708\ufe0f",
 "items": ["Passport", "Sunscreen", "Suitcase", "Beach Towel", "Boarding Pass"]
 },
 {
 "id": "unique",
 "name": "Unique",
 "icon": "\ud83c\udfb2",
 "items": ["Disco Ball", "Time Machine", "Rubber Chicken", "Lava Lamp"]
 }
 ]
}
```

**Runtime player state** (in-memory, not in the data file):

```json
{
 "players": [
 {"id": "p1", "name": "Alex", "color": "#e63946", "score": 0},
 {"id": "p2", "name": "Sam", "color": "#457b9d", "score": 0}
 ]
}
```

**Rules encoded here, not in the JS logic:** category id/name/icon and its item list. Adding a new category or item is purely a data edit. The player list has no fixed size — the game logic renders one chip per entry in `players`, however many there are.

## 7. File Structure & Repo Layout

```
words-are-hard/
├── index.html # markup + screen containers, registers the service worker
├── style.css # all styling, responsive rules
├── script.js # game logic, state machine, tap handlers
├── manifest.json # PWA manifest (name, icons, start_url, display: standalone)
├── service-worker.js # caches the app shell for offline/installed use
├── data/
│ └── categories.js # exports the categories/items object (see Data Model)
├── icons/
│ ├── icon-192.png
│ └── icon-512.png
└── README.md # how to run locally + how to add categories/items
```

Plain relative paths only (no absolute server paths, no build-time path rewriting) so the same files work identically whether opened locally as `file://index.html` or served from a repo's Pages URL. Keeping logic, styling, and content in separate files means updating the word lists (the most common future change) never touches game code or the PWA files.

## 8. Deployment

1. **Build:** Claude Code writes `index.html`, `style.css`, `script.js`, and `data/categories.js` directly per the File Structure section above — no compilation step, so "built" and "deployable" are the same files.
2. **Commit:** Files are committed and pushed to the user's Git repo (e.g. `git add . && git commit -m "..." && git push`).
3. **Host:** The repo's static hosting (e.g. GitHub Pages, enabled on the repo's `main` branch or a `/docs` folder, or any static host pointed at the repo) serves `index.html` at the root, giving a public URL anyone can open to play — no server process to run or maintain.
4. **Update flow going forward:** Any future change (new category, new items, tweaked scoring, UI tweak) is a normal commit + push to the same repo; the live site picks it up automatically once the host rebuilds/redeploys (near-instant for GitHub Pages).
5. GitHub Pages serves over HTTPS automatically, which is required for the service worker/install prompt to work — no extra config needed there. **No environment variables or secrets** are needed since there's no backend or API calls in v1.

## 9. Acceptance Criteria

- [ ] App loads on mobile and desktop browsers via a single static URL, no login required.
- [ ] App is installable as a PWA (manifest + service worker pass basic installability checks; browser shows an install/"Add to Home Screen" prompt).
- [ ] Installed app launches and the app shell (menu, category select) still loads when offline.
- [ ] Main menu → player setup → category select → play → round summary → back to menu all work with no page reloads.
- [ ] Player setup accepts 2 or more players, each with a name; "Continue" is disabled below 2 players.
- [ ] Player can pick at least one of the 4 launch categories (Everyday, Holiday, Vacation, Unique) or "All/Mixed".
- [ ] Tapping the center reveal zone always shows a new item without immediate repeats until the pool is exhausted.
- [ ] Tapping any player's chip in the scoring bar increments that player's score and advances to the next item in one tap.
- [ ] All players' running scores are visible on-screen at all times during play.
- [ ] Round summary ranks every player by final score and offers Play Again / Back to Menu.
- [ ] Adding a new category or item requires only editing `data/categories.js`, no other file changes.
- [ ] Works over touch and mouse input; layout and scoring bar hold up in portrait and landscape with many players.

## 10. Future Enhancements (Out of Scope for v1)

- Sound effects / haptic buzz on tap and round end.
- Custom/user-submitted categories, or a way to hide categories not wanted for a given crowd (e.g. kid-friendly filter).
- Persistent leaderboard or multi-round match score across several rounds.
- Shareable results (e.g. final rankings) via a native share sheet.
- Difficulty tiers within a category (easy/hard word pools).
- Light/dark theme toggle.
- Optional per-round timer as a togglable setting (removed from v1, could return later as opt-in).
