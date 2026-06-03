// ---------------------------------------------------------------------------
// FIFA World Cup 2026 — full tournament fixtures.
//
// Group draw (official, 5 Dec 2025) is exact. Group-stage dates follow FIFA's
// published matchday windows; kickoff TIMES here are nominal/spread so the
// "active match" auto-selection has something to sort on — refine them with
// the official slot times if you need them exact. Knockout rounds are TBD
// placeholders (teams unknown until the groups finish) with correct date
// windows; fill in `teams` once each tie is confirmed and voting opens for it.
// ---------------------------------------------------------------------------

export const TOURNAMENT = {
  name: "FIFA World Cup 2026",
  hosts: "USA · Canada · Mexico",
  start: "2026-06-11",
  end: "2026-07-19",
};

// ISO 3166-1 alpha-2 codes used to fetch flags from flagcdn.com.
// Home nations use flagcdn subdivision codes (gb-sct, gb-eng).
const CODE = {
  Mexico: "mx",
  "South Africa": "za",
  "South Korea": "kr",
  "Czech Republic": "cz",
  Canada: "ca",
  "Bosnia and Herzegovina": "ba",
  Qatar: "qa",
  Switzerland: "ch",
  Brazil: "br",
  Morocco: "ma",
  Haiti: "ht",
  Scotland: "gb-sct",
  "United States": "us",
  Paraguay: "py",
  Australia: "au",
  Turkey: "tr",
  Germany: "de",
  Curaçao: "cw",
  "Ivory Coast": "ci",
  Ecuador: "ec",
  Netherlands: "nl",
  Japan: "jp",
  Sweden: "se",
  Tunisia: "tn",
  Belgium: "be",
  Egypt: "eg",
  Iran: "ir",
  "New Zealand": "nz",
  Spain: "es",
  "Cape Verde": "cv",
  "Saudi Arabia": "sa",
  Uruguay: "uy",
  France: "fr",
  Senegal: "sn",
  Iraq: "iq",
  Norway: "no",
  Argentina: "ar",
  Algeria: "dz",
  Austria: "at",
  Jordan: "jo",
  Portugal: "pt",
  "DR Congo": "cd",
  Uzbekistan: "uz",
  Colombia: "co",
  England: "gb-eng",
  Croatia: "hr",
  Ghana: "gh",
  Panama: "pa",
};

// The 12 groups, in seeded order (position 1..4).
const GROUPS = {
  A: ["Mexico", "South Africa", "South Korea", "Czech Republic"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["United States", "Paraguay", "Australia", "Turkey"],
  E: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

// Matchday pairings by seed position (0-indexed): MD1 1v2/3v4, MD2 1v3/4v2,
// MD3 4v1/2v3 — the official rotation.
const PAIRINGS = {
  1: [
    [0, 1],
    [2, 3],
  ],
  2: [
    [0, 2],
    [3, 1],
  ],
  3: [
    [3, 0],
    [1, 2],
  ],
};

// Date each group plays each matchday (from FIFA's published windows).
const MD_DATE = {
  1: {
    A: "06-11",
    B: "06-12",
    C: "06-13",
    D: "06-12",
    E: "06-14",
    F: "06-14",
    G: "06-15",
    H: "06-15",
    I: "06-16",
    J: "06-16",
    K: "06-17",
    L: "06-17",
  },
  2: {
    A: "06-18",
    B: "06-18",
    C: "06-19",
    D: "06-19",
    E: "06-20",
    F: "06-20",
    G: "06-21",
    H: "06-21",
    I: "06-22",
    J: "06-22",
    K: "06-23",
    L: "06-23",
  },
  3: {
    A: "06-24",
    B: "06-24",
    C: "06-24",
    D: "06-25",
    E: "06-25",
    F: "06-25",
    G: "06-26",
    H: "06-26",
    I: "06-26",
    J: "06-27",
    K: "06-27",
    L: "06-27",
  },
};

// Stable, distinct accent colour per team (flag is the real identifier).
export function teamColor(name) {
  let h = 0;
  for (let i = 0; i < String(name).length; i++)
    h = (h * 31 + String(name).charCodeAt(i)) % 360;
  return `hsl(${h}, 62%, 48%)`;
}

// Hoisted so team() can use it during module init (export const isn't hoisted).
function flagUrlFor(code, size = "w160") {
  return code ? `https://flagcdn.com/${size}/${code}.png` : null;
}

function team(name) {
  if (!name) return { code: null, name: "TBD", color: "#5b6488", flag: null };
  const code = CODE[name] || null;
  return { code, name, color: teamColor(name), flag: flagUrlFor(code) };
}

// Spread kickoff hours (UTC) so simultaneous-day matches sort distinctly.
const HOURS = [13, 16, 19, 22];

function isoAt(mmdd, hour, minute = 0) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `2026-${mmdd}T${hh}:${mm}:00Z`;
}

function buildGroupStage() {
  const out = [];
  const groupLetters = Object.keys(GROUPS);
  groupLetters.forEach((g, gi) => {
    const squad = GROUPS[g];
    for (let md = 1; md <= 3; md++) {
      PAIRINGS[md].forEach(([a, b], mi) => {
        const hour = HOURS[(gi + mi) % HOURS.length];
        out.push({
          id: `gs-${g}-md${md}-${mi + 1}`,
          stage: "Group Stage",
          group: g,
          matchday: md,
          label: `Group ${g} · Matchday ${md}`,
          kickoff: isoAt(MD_DATE[md][g], hour, (gi % 2) * 30),
          teams: [team(squad[a]), team(squad[b])],
        });
      });
    }
  });
  return out;
}

// Knockout placeholders: correct round + date windows, teams TBD until drawn.
function buildKnockouts() {
  const rounds = [
    { key: "r32", stage: "Round of 32", n: 16, from: "06-28", to: "07-03" },
    { key: "r16", stage: "Round of 16", n: 8, from: "07-04", to: "07-07" },
    { key: "qf", stage: "Quarter-final", n: 4, from: "07-09", to: "07-11" },
    { key: "sf", stage: "Semi-final", n: 2, from: "07-14", to: "07-15" },
    {
      key: "3p",
      stage: "Third-place play-off",
      n: 1,
      from: "07-18",
      to: "07-18",
    },
    { key: "final", stage: "Final", n: 1, from: "07-19", to: "07-19" },
  ];
  const out = [];
  for (const r of rounds) {
    const startDay = Number(r.from.slice(3));
    const endDay = Number(r.to.slice(3));
    const month = r.from.slice(0, 2);
    const span = endDay - startDay + 1;
    for (let i = 0; i < r.n; i++) {
      const day = startDay + Math.floor((i * span) / r.n);
      const hour = HOURS[i % HOURS.length];
      out.push({
        id: r.n > 1 ? `ko-${r.key}-${i + 1}` : `ko-${r.key}`,
        stage: r.stage,
        group: null,
        matchday: null,
        label: r.n > 1 ? `${r.stage} · Match ${i + 1}` : r.stage,
        kickoff: isoAt(`${month}-${String(day).padStart(2, "0")}`, hour),
        teams: [team(null), team(null)],
        tbd: true,
      });
    }
  }
  return out;
}

// Static fallback fixtures (used until the live poller has written data).
// Each carries status:null/score:null so the unified selectors below work the
// same on static and live data.
export const FIXTURES = [...buildGroupStage(), ...buildKnockouts()]
  .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
  .map((f) => ({ status: null, score: null, ...f }));

export const flagUrl = flagUrlFor;

export const getMatchById = (fixtures, id) =>
  (fixtures || []).find((m) => m.id === id) || null;

// ---- Unified match state (works on both static and live fixtures) ----------

const MATCH_DURATION = 120 * 60 * 1000; // fallback "finished" window (static)
const OPEN_STATUSES = ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "SUSPENDED"];
const OVER_STATUSES = ["FINISHED", "AWARDED", "CANCELLED", "POSTPONED"];

const teamsKnown = (m) => m.teams.every((t) => Boolean(t.code));

// "Over" = result is final / not happening. Live -> status; static -> by time.
function isOver(m, t) {
  if (m.status) return OVER_STATUSES.includes(m.status);
  return new Date(m.kickoff).getTime() + MATCH_DURATION < t;
}

// Voting stays open until the match finishes (covers extra time + penalties
// via the live FINISHED status). Teams must be confirmed.
export function isVotingOpen(m, now = new Date()) {
  if (!m || !teamsKnown(m)) return false;
  if (m.status) return OPEN_STATUSES.includes(m.status);
  return now.getTime() < new Date(m.kickoff).getTime() + MATCH_DURATION;
}

// Group matches by UK calendar day so "one day's matches" is consistent
// regardless of the viewer's own timezone. en-CA formats as YYYY-MM-DD.
const UK_TZ = "Europe/London";
const ukDayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayKey = (m) => ukDayFmt.format(new Date(m.kickoff));

const byKickoff = (a, b) => new Date(a.kickoff) - new Date(b.kickoff);

// The distinct day-keys covering the next `days` match-days, drawn from the
// still-to-come matches (or all matches once the tournament is over).
function activeDayKeys(fixtures, t, days) {
  const votable = fixtures.filter(teamsKnown).sort(byKickoff);
  const remaining = votable.filter((m) => !isOver(m, t));
  const pool = remaining.length ? remaining : votable;
  const order = [];
  for (const m of pool) {
    const d = dayKey(m);
    if (!order.includes(d)) order.push(d);
    if (order.length >= days) break;
  }
  return { set: new Set(order), pool, votable };
}

/**
 * Matches for the rotating main widget: not-yet-over matches on the next
 * `days` distinct match-days (default 2 = today + tomorrow).
 */
export function getUpcomingDaysFixtures(fixtures, now = new Date(), days = 2) {
  const { set, pool } = activeDayKeys(fixtures, now.getTime(), days);
  return pool.filter((m) => set.has(dayKey(m))).sort(byKickoff);
}

/**
 * EVERY confirmed match (finished included) on the next `days` match-days. The
 * vote page uses this to show open matches plus a "finished" results section.
 */
export function getUpcomingDaysAll(fixtures, now = new Date(), days = 2) {
  const { set, votable } = activeDayKeys(fixtures, now.getTime(), days);
  return votable.filter((m) => set.has(dayKey(m))).sort(byKickoff);
}

// Format a kickoff in UK time, e.g. "Thu 11 Jun, 14:00".
export function fmtKickoffUK(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
