import { useEffect, useMemo, useState } from "react";
import { useFixtures } from "../data/useFixtures.js";
import { subscribeAllVotes } from "../firebase.js";
import Loader from "../components/Loader.jsx";

/* ---------------------------------------------------------------------------
 * Vote-count / results page.
 *   1. Today's matches with vote counts + percentages.
 *   2. A date picker — pick any day to see that day's matches (with score).
 *   3. A tournament-wide leaderboard: every team's total votes, most first.
 * Reads live fixtures (via useFixtures) and every match's votes at once
 * (subscribeAllVotes). Light theme, matching the vote page.
 * ------------------------------------------------------------------------- */

const ukDay = (iso) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

const ukDateLabel = (iso) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));

const ukTime = (iso) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const hasScore = (m) =>
  m.score && ["IN_PLAY", "PAUSED", "FINISHED"].includes(m.status);

// The played minute. football-data's free tier usually omits `minute`, so when
// it's missing we approximate it from the kickoff time (best-effort: it doesn't
// subtract the half-time break, but gives a live "how long it's been playing").
const playedMinute = (m) => {
  if (m.minute) return m.minute;
  const mins = Math.floor((Date.now() - new Date(m.kickoff).getTime()) / 60000);
  return mins >= 0 && mins <= 130 ? mins : null;
};

const statusLine = (m) => {
  if (m.status === "IN_PLAY") {
    const min = playedMinute(m);
    return min != null ? `LIVE ${min}'` : "LIVE";
  }
  if (m.status === "PAUSED") return "HALF-TIME";
  if (m.status === "FINISHED") return "FULL-TIME";
  return ukTime(m.kickoff);
};

const Flag = ({ team, className }) =>
  team.flag ? (
    <img
      src={team.flag}
      alt={`${team.name} flag`}
      className={`object-cover rounded ${className}`}
    />
  ) : (
    <span
      className={`bg-[#EAD7C4] text-[#8C7D6F] font-extrabold flex items-center justify-center rounded ${className}`}
    >
      ?
    </span>
  );

/* A single match's vote breakdown. */
function MatchResult({ match, votes }) {
  const score = hasScore(match) ? match.score : null;
  const total = match.teams.reduce((s, t) => s + (votes[t.code] || 0), 0);
  const leader = Math.max(...match.teams.map((t) => votes[t.code] || 0));

  return (
    <div className="bg-[#F9E9DE] border border-[#EAD7C4] rounded-xl p-3">
      <div className="flex items-center justify-between gap-2 text-[0.7rem] mb-2">
        <span className="font-bold text-[#1A1715] truncate">{match.label}</span>
        <span
          className={`shrink-0 ${
            match.status === "IN_PLAY"
              ? "text-[#C2683E] font-bold"
              : "text-[#8C7D6F]"
          }`}
        >
          {statusLine(match)}
        </span>
      </div>

      {match.teams.map((team, i) => {
        const v = votes[team.code] || 0;
        const pct = total ? (v / total) * 100 : 0;
        const isLeader = total > 0 && v === leader;
        const goals = score ? (i === 0 ? score.home : score.away) : null;
        return (
          <div key={team.code || i} className="mb-2.5 last:mb-0">
            <div className="flex items-center gap-2">
              <Flag team={team} className="w-8 h-6 shrink-0" />
              <span className="flex-1 min-w-0 truncate font-bold text-[#1A1715] text-sm">
                {team.name}
              </span>
              {goals != null && (
                <span className="shrink-0 min-w-[20px] h-5 px-1 rounded bg-[#F9E6D7] border border-[#D9BFA6] text-[#1A1715] font-extrabold text-[11px] flex items-center justify-center tabular-nums">
                  {goals}
                </span>
              )}
              <span className="shrink-0 font-extrabold tabular-nums text-[#1A1715] text-sm">
                {v}
              </span>
              <span className="shrink-0 w-10 text-right text-[#8C7D6F] text-xs tabular-nums">
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[#F9E6D7] overflow-hidden">
              <div
                className={`h-full rounded-full ${isLeader ? "bg-[#C2683E]" : "bg-[#D9BFA6]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="text-right text-[0.65rem] text-[#8C7D6F] mt-1.5">
        {total} vote{total === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { fixtures, loading } = useFixtures();
  const [votesByMatch, setVotesByMatch] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => ukDay(Date.now()));
  const [, setTick] = useState(0); // re-render so the live minute keeps ticking

  useEffect(() => subscribeAllVotes(setVotesByMatch), []);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20000);
    return () => clearInterval(id);
  }, []);

  const logo = (name) => `${import.meta.env.BASE_URL}${name}`;
  const todayKey = ukDay(Date.now());

  const known = useMemo(
    () =>
      (fixtures || [])
        .filter((m) => Array.isArray(m.teams) && m.teams.every((t) => t.code))
        .slice()
        .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)),
    [fixtures],
  );

  const todayMatches = useMemo(
    () => known.filter((m) => ukDay(m.kickoff) === todayKey),
    [known, todayKey],
  );

  const dayMatches = useMemo(
    () => known.filter((m) => ukDay(m.kickoff) === selectedDate),
    [known, selectedDate],
  );

  // Tournament-wide totals per team (across every match), most votes first.
  const leaderboard = useMemo(() => {
    const map = {};
    for (const m of known) {
      const v = votesByMatch[m.id] || {};
      for (const t of m.teams) {
        if (!t.code) continue;
        if (!map[t.code])
          map[t.code] = { code: t.code, name: t.name, flag: t.flag, total: 0 };
        if (!map[t.code].flag && t.flag) map[t.code].flag = t.flag;
        map[t.code].total += v[t.code] || 0;
      }
    }
    return Object.values(map).sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name),
    );
  }, [known, votesByMatch]);

  const maxTotal = leaderboard[0]?.total || 0;

  return (
    <div className="vote-page bg-[#FBF7EE] min-h-screen w-full overflow-x-hidden text-[#1A1715]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-7 sm:gap-9">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-[#EAD7C4] pb-3">
          <div className="leading-none">
            <span className="block text-[11px] tracking-[0.35em] text-[#8C7D6F]">
              FIFA WORLD CUP 2026
            </span>
            <span className="block text-2xl sm:text-3xl font-black text-[#1A1715]">
              Live Vote Count
            </span>
          </div>
          <img
            src={logo("fifa_2026.png")}
            alt="FIFA World Cup 2026"
            className="h-12 sm:h-14 object-contain"
          />
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* 1 — Today's matches */}
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-[#1A1715] mb-3">
                Today's Matches
                <span className="ml-2 font-medium normal-case text-[#8C7D6F]">
                  · {ukDateLabel(Date.now())}
                </span>
              </h2>
              {todayMatches.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {todayMatches.map((m) => (
                    <MatchResult
                      key={m.id}
                      match={m}
                      votes={votesByMatch[m.id] || {}}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[#8C7D6F] text-sm">No matches today.</p>
              )}
            </section>

            {/* 2 — Pick a date */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="text-sm font-black uppercase tracking-wide text-[#1A1715]">
                  Matches by Date
                </h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-[#E0C9B2] bg-white px-3 py-1.5 text-sm text-[#1A1715]"
                />
              </div>
              {dayMatches.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayMatches.map((m) => (
                    <MatchResult
                      key={m.id}
                      match={m}
                      votes={votesByMatch[m.id] || {}}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[#8C7D6F] text-sm">
                  No matches on {ukDateLabel(`${selectedDate}T12:00:00Z`)}.
                </p>
              )}
            </section>

            {/* 3 — Tournament leaderboard */}
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-[#1A1715] mb-3">
                Tournament Leaderboard
                <span className="ml-2 font-medium normal-case text-[#8C7D6F]">
                  · total votes
                </span>
              </h2>
              {leaderboard.length ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {leaderboard.map((t, i) => {
                    const pct = maxTotal ? (t.total / maxTotal) * 100 : 0;
                    return (
                      <div
                        key={t.code}
                        className="relative flex items-center gap-3 bg-[#F9E9DE] border border-[#EAD7C4] rounded-lg px-3 py-2 overflow-hidden"
                      >
                        {/* subtle bar showing share of the leader */}
                        <div
                          className="absolute inset-y-0 left-0 bg-[#F9E6D7]"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative w-6 text-center font-black tabular-nums text-[#8C7D6F]">
                          {i + 1}
                        </span>
                        <Flag team={t} className="relative w-8 h-6 shrink-0" />
                        <span className="relative flex-1 min-w-0 truncate font-bold text-[#1A1715]">
                          {t.name}
                        </span>
                        <span className="relative font-extrabold tabular-nums text-[#1A1715]">
                          {t.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#8C7D6F] text-sm">No teams yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
