// ---------------------------------------------------------------------------
// football-data.org -> Firebase poller
//
// Polls the World Cup 2026 matches every POLL_MS and writes a normalized
// fixture list (teams, crest, status, live score) to Realtime Database at
// `worldcup/fixtures`. The web app subscribes to that node, so:
//   - browsers never call football-data directly (avoids CORS + rate limits),
//   - knockout teams fill in automatically as rounds are decided,
//   - voting closes exactly when a match reaches status FINISHED
//     (after extra time / penalties), and
//   - live scores are available to show beside the flags.
//
// Run it on one always-on machine:  npm run poll
// Needs in .env:  FOOTBALL_DATA_TOKEN  +  your VITE_FIREBASE_* values.
// ---------------------------------------------------------------------------
import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const POLL_MS = Number(process.env.POLL_MS || 20000);
// football-data competition code. Default WC (FIFA World Cup). For testing the
// live score/minute pipeline BEFORE the World Cup starts, set
// FOOTBALL_DATA_COMPETITION in .env to a competition that's in play now, e.g.
// BSA (Brazil Série A), PL, PD, SA — then switch back to WC.
const COMPETITION = process.env.FOOTBALL_DATA_COMPETITION || "WC";

if (!TOKEN) {
  console.error("Missing FOOTBALL_DATA_TOKEN in .env — get a free key at football-data.org");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
if (!firebaseConfig.databaseURL) {
  console.error("Missing VITE_FIREBASE_DATABASE_URL in .env");
  process.exit(1);
}

const db = getDatabase(initializeApp(firebaseConfig));

const STAGE_LABEL = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  THIRD_PLACE: "Third-place play-off",
  FINAL: "Final",
};

const teamOf = (t) =>
  t && t.name
    ? { code: t.tla || String(t.id), name: t.name, flag: t.crest || null }
    : { code: null, name: "TBD", flag: null };

function normalize(m) {
  const stage = STAGE_LABEL[m.stage] || m.stage;
  const group = m.group ? m.group.replace("GROUP_", "Group ") : null;
  const label = group
    ? `${group} · Matchday ${m.matchday}`
    : stage;
  const ft = (m.score && m.score.fullTime) || {};
  const hasScore = ft.home != null || ft.away != null;
  return {
    id: String(m.id),
    stage,
    group,
    matchday: m.matchday ?? null,
    label,
    kickoff: m.utcDate,
    status: m.status, // SCHEDULED|TIMED|IN_PLAY|PAUSED|FINISHED|...
    minute: m.minute ?? null,
    teams: [teamOf(m.homeTeam), teamOf(m.awayTeam)],
    score: hasScore ? { home: ft.home ?? 0, away: ft.away ?? 0 } : null,
  };
}

async function pollOnce() {
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${COMPETITION}/matches`,
    { headers: { "X-Auth-Token": TOKEN } }
  );
  if (!res.ok) {
    console.error(`football-data ${res.status} ${res.statusText}`);
    return;
  }
  const data = await res.json();
  const fixtures = (data.matches || []).map(normalize);
  await set(ref(db, "worldcup"), { fixtures, updatedAt: Date.now() });
  const live = fixtures.filter((f) => f.status === "IN_PLAY" || f.status === "PAUSED").length;
  console.log(
    `${new Date().toISOString()}  wrote ${fixtures.length} fixtures (${live} live)`
  );
}

console.log(`Polling football-data (${COMPETITION}) every ${POLL_MS / 1000}s…`);
await pollOnce();
setInterval(() => pollOnce().catch((e) => console.error(e.message)), POLL_MS);
