# World Cup Match Poll Widget

A React app for live FIFA World Cup match-winner polling.

- **Main screen** (`/`) — a compact bottom widget that **rotates through today's and tomorrow's matches** on a fixed timer (`ROTATE_MS`, default 15s). Each match shows its two team rows (flag, live bar, percentage) and a **QR code** pointing to that match's vote page. Matches drop out once finished and the window rolls forward automatically — good for an unattended monitor. Dots under the strip show how many matches are in rotation.
- **Vote page** (`/vote`) — opens in the viewer's mobile browser after they scan the QR. It lists **today's and tomorrow's matches**. Tapping a team opens an "Are you sure?" confirmation modal; voting is **unlimited** (no per-device lock) and stays open **until the match finishes**. A collapsible "Finished / closed today" section holds read-only results for matches that have ended. The scanned match is highlighted and floated to the top. Votes are written to Firebase keyed per match, and every main screen updates in real time.

## Stack

Vite + React Router, styled with Tailwind CSS. `qrcode.react` renders the scannable QR code, and Firebase Realtime Database handles multi-device real-time vote sync. The bars are plain divs (no chart library). Brand colours (`base`, `panel`, `line`, `ink`, `muted`, `accent`, `track`) are defined in `tailwind.config.js`.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Firebase keys
npm run dev
```

Open http://localhost:5173.

### Firebase

1. Create a project at https://console.firebase.google.com.
2. Add a **Web App** and copy its config into `.env` (see `.env.example`).
3. Enable **Realtime Database**. For a quick demo set rules to test mode:
   ```json
   {
     "rules": {
       "polls": { ".read": true, ".write": true },
       "worldcup": { ".read": true, ".write": true }
     }
   }
   ```
   (Lock these down before any public deployment — see the security note below.)

Votes are stored at `polls/<matchId>/votes/<teamCode>` and incremented atomically via a transaction, so concurrent voters can't clobber each other's counts. Live fixtures are written by the poller to `worldcup/fixtures`.

> **No Firebase yet?** The app still runs in **demo mode** — votes are kept in `localStorage` and synced across browser tabs on the same machine, so you can see the polling UI work end to end.

## Live data (football-data.org)

Fixtures, knockout matchups, match status, and live scores come from [football-data.org](https://www.football-data.org) via a small poller — so you never hand-edit the fixture file, knockout teams fill in automatically, voting closes exactly when a match reaches `FINISHED` (after extra time / penalties), and scores show beside the flags.

1. Get a free API token at football-data.org and put it in `.env` as `FOOTBALL_DATA_TOKEN` (make sure your plan includes the **World Cup** competition, code `WC`).
2. Run the poller on one always-on machine, alongside the app:
   ```bash
   npm run poll
   ```
   It fetches `/v4/competitions/WC/matches` every `POLL_MS` (default 20s), normalizes each match, and writes the list to `worldcup/fixtures` in Firebase. The browser reads from Firebase only — it never calls football-data directly (avoids CORS and per-client rate limits).

The app subscribes to that node via `useFixtures()` and **falls back to the static `match.js` fixtures** whenever the poller hasn't written data yet, so it always renders something.

> **Security:** the demo rules leave `worldcup` world-writable so the poller can write with the web SDK. For production, lock `worldcup` to read-only and run the poller with the Firebase Admin SDK (service account), which bypasses rules.

## The QR code

The main screen renders a QR code (via `qrcode.react`) that encodes the vote URL. Viewers just open their phone's built-in camera, point it at the screen, and tap the link that pops up — it opens `/vote` in their mobile browser. No app or in-page scanner needed.

The QR encodes `<base>/vote`, where `<base>` is:

1. `VITE_PUBLIC_URL` from your `.env` if set (use this for a deployed app, e.g. `https://your-app.com`), otherwise
2. the address the app is currently served on (`window.location.origin`).

**Important:** the URL must be reachable from the phone. `localhost` won't work from a phone. To test on the same Wi‑Fi, serve over your LAN:

```bash
npm run build && npm run preview -- --host
```

Vite prints a Network URL like `http://192.168.1.20:4173`. Open that on the main screen — the QR will encode `http://192.168.1.20:4173/vote`, which your phone can reach. For production, deploy to any HTTPS static host and set `VITE_PUBLIC_URL` to that domain.

## The fixtures

When the poller is running, fixtures come **live** from football-data (see above). Without it, the app uses the static fallback in `src/data/match.js`:

- **Group stage** — all 72 matches generated from the official 5 Dec 2025 draw (the 12 groups in `GROUPS`) plus FIFA's matchday windows (`MD_DATE`). Flags from `flagcdn.com` by country code.
- **Knockouts** — Round of 32 → Final as **TBD placeholders** (the live feed fills in the real teams).

Selection is unified across live and static data: `getUpcomingDaysFixtures()` (rotating widget) and `getUpcomingDaysAll()` (vote page) return the next two distinct match-days; `isVotingOpen()` uses the live `status` when present (open until `FINISHED`) and falls back to a time window for static fixtures. Each fixture's `id` is its Firebase vote key (`polls/<id>/votes`).

To add or change a team, edit the `GROUPS` map and the `CODE` lookup (team name → ISO code). Colours are auto-derived per team.

## Project structure

```
src/
  data/match.js          # fixtures + active-day / voting-window selectors
  firebase.js            # Firebase init, vote read/write, local fallback
  components/
    MatchVoteCard.jsx    # one match's two-team voting block (used in a list)
    VoteQRCode.jsx       # QR code (encodes /vote URL) for phones to scan
  pages/
    MainScreen.jsx       # rotating poll widget (the big screen)
    VotePage.jsx         # list of today's matches to vote on (the phone)
  main.jsx               # router
  index.css              # Tailwind directives + base styles
tailwind.config.js       # brand colour theme
postcss.config.js        # Tailwind + autoprefixer
```
