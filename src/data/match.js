// ---------------------------------------------------------------------------
// FIFA World Cup 2026 — live data helpers.
//
// There are intentionally NO static/hardcoded fixtures here. The app reads the
// live fixture list from the football-data poller (written to Firebase) via
// `useFixtures`. This file only holds the selectors/formatters that operate on
// whatever live fixtures are passed in, plus a couple of small shared utils.
// ---------------------------------------------------------------------------

export const TOURNAMENT = {
  name: "FIFA World Cup 2026",
  hosts: "USA · Canada · Mexico",
  start: "2026-06-11",
  end: "2026-07-19",
};

// Stable, distinct accent colour per team (flag is the real identifier).
export function teamColor(name) {
  let h = 0;
  for (let i = 0; i < String(name).length; i++)
    h = (h * 31 + String(name).charCodeAt(i)) % 360;
  return `hsl(${h}, 62%, 48%)`;
}

export const getMatchById = (fixtures, id) =>
  (fixtures || []).find((m) => m.id === id) || null;

// ---- Unified match state (operates on live fixtures) -----------------------

const MATCH_DURATION = 120 * 60 * 1000; // "finished" window when no live status
const OPEN_STATUSES = ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "SUSPENDED"];
const OVER_STATUSES = ["FINISHED", "AWARDED", "CANCELLED", "POSTPONED"];

const teamsKnown = (m) => m.teams.every((t) => Boolean(t.code));

// "Over" = result is final / not happening. Live -> status; else -> by time.
function isOver(m, t) {
  if (m.status) return OVER_STATUSES.includes(m.status);
  return new Date(m.kickoff).getTime() + MATCH_DURATION < t;
}

// Voting stays open until the match finishes (covers extra time + penalties via
// the live FINISHED status). Teams must be confirmed.
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
