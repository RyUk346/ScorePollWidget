import { useEffect, useMemo, useState } from "react";
import {
  TOURNAMENT,
  getUpcomingDaysFixtures,
  fmtKickoffUK,
} from "../data/match.js";
import { useFixtures } from "../data/useFixtures.js";
import { subscribeVotes, firebaseConfigured } from "../firebase.js";
import VoteQRCode from "../components/VoteQRCode.jsx";

const ROTATE_MS = 15000; // how long each match is shown before rotating
const REFRESH_MS = 30000; // how often we recompute the day's match set

const statusLine = (m) => {
  if (m.status === "IN_PLAY") return m.minute ? `LIVE ${m.minute}'` : "LIVE";
  if (m.status === "PAUSED") return "HALF-TIME";
  if (m.status === "FINISHED") return "FULL-TIME";
  return fmtKickoffUK(m.kickoff);
};

const hasScore = (m) =>
  m.score &&
  (m.status === "IN_PLAY" || m.status === "PAUSED" || m.status === "FINISHED");

export default function MainScreen() {
  const all = useFixtures();
  const [tick, setTick] = useState(0);
  const [index, setIndex] = useState(0);
  const [votes, setVotes] = useState({});

  // Recompute the today+tomorrow set periodically (and when live data changes).
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);
  const fixtures = useMemo(
    () => getUpcomingDaysFixtures(all, new Date(), 2),
    [all, tick],
  );

  useEffect(() => {
    setIndex((i) => (fixtures.length ? i % fixtures.length : 0));
  }, [fixtures.length]);

  useEffect(() => {
    if (fixtures.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % fixtures.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [fixtures.length]);

  const match = fixtures[index] || null;

  useEffect(() => {
    if (!match) return;
    setVotes({});
    return subscribeVotes(match.id, setVotes);
  }, [match?.id]);

  if (!match) return null;

  const total = match.teams.reduce((s, t) => s + (votes[t.code] || 0), 0);
  const leader = Math.max(...match.teams.map((t) => votes[t.code] || 0));
  const showScore = hasScore(match);

  return (
    <div className="min-h-screen flex flex-col justify-end items-center p-4 gap-2">
      <div className="flex items-center h-[280px] gap-[18px] w-full bg-base/90 border border-line rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-sm">
        <div className="shrink-0">
          <VoteQRCode matchId={match.id} size={200} compact />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-baseline gap-2.5 text-xs">
            <span className="font-bold tracking-wide text-ink">
              {TOURNAMENT.name}
            </span>
            <span className="text-muted whitespace-nowrap overflow-hidden text-ellipsis">
              {match.label}
            </span>
            <span
              className={`ml-auto tabular-nums whitespace-nowrap ${
                match.status === "IN_PLAY"
                  ? "text-accent font-bold"
                  : "text-muted"
              }`}
            >
              {statusLine(match)} · {total.toLocaleString()}{" "}
              {total === 1 ? "vote" : "votes"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {match.teams.map((team, i) => {
              const count = votes[team.code] || 0;
              const pct = total ? (count / total) * 100 : 0;
              const isLeader = total > 0 && count === leader;
              const goals = showScore
                ? i === 0
                  ? match.score.home
                  : match.score.away
                : null;
              return (
                <div
                  key={team.code || i}
                  className="grid grid-cols-[160px_1fr_44px] items-center gap-4"
                >
                  <div className="relative w-[160px] h-[100px] mb-1">
                    {team.flag ? (
                      <img
                        className="w-[160px] h-[100px] object-cover rounded ring-1 ring-white/15"
                        src={team.flag}
                        alt={`${team.name} flag`}
                      />
                    ) : (
                      <span className="w-[160px] h-[100px] rounded bg-track text-muted font-extrabold flex items-center justify-center">
                        ?
                      </span>
                    )}
                    {goals != null && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[24px] h-6 px-1 rounded-md bg-base/95 border border-line text-ink font-extrabold text-sm flex items-center justify-center tabular-nums">
                        {goals}
                      </span>
                    )}
                  </div>
                  <div className="h-6 bg-track border border-line rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%`, background: team.color }}
                    />
                  </div>
                  <span
                    className={`text-right font-extrabold tabular-nums text-[0.95rem] ${
                      isLeader ? "text-accent" : "text-ink"
                    }`}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {fixtures.length > 1 && (
        <div
          className="flex gap-[7px] items-center"
          aria-label={`Match ${index + 1} of ${fixtures.length}`}
        >
          {fixtures.map((f, i) => (
            <span
              key={f.id}
              className={`w-[7px] h-[7px] rounded-full transition-all ${
                i === index ? "bg-accent scale-125" : "bg-line"
              }`}
            />
          ))}
        </div>
      )}

      {!firebaseConfigured && (
        <p className="text-[0.72rem] text-muted m-0">
          Demo mode — add your <code>.env</code> for real-time multi-device
          voting.
        </p>
      )}
    </div>
  );
}
