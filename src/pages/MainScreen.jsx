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
  const [logoOk, setLogoOk] = useState(true);
  const fixtures = useMemo(
    () => getUpcomingDaysFixtures(all, new Date(), 2),
    [all, tick],
  );

  // Slides = an intro cover (index 0) + one slide per match.
  const slideCount = fixtures.length + 1;

  useEffect(() => {
    setIndex((i) => i % slideCount);
  }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slideCount),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [slideCount]);

  const isIntro = index === 0;
  const match = isIntro ? null : fixtures[index - 1] || null;

  useEffect(() => {
    setVotes({});
    if (!match) return;
    return subscribeVotes(match.id, setVotes);
  }, [match?.id]);

  const total = match
    ? match.teams.reduce((s, t) => s + (votes[t.code] || 0), 0)
    : 0;
  const leader = match
    ? Math.max(...match.teams.map((t) => votes[t.code] || 0))
    : 0;
  const showScore = match && hasScore(match);
  const logoUrl = `${import.meta.env.BASE_URL}fifa_2026.png`;

  return (
    <div className="flex flex-col items-center p-4 gap-2">
      <div className="relative flex items-center h-[170px] gap-4 w-full rounded-3xl px-4 py-3 bg-black/40 backdrop-blur-2xl border border-white/20 overflow-hidden ">
        {isIntro ? (
          <>
            {/* QR — left */}
            <div className="shrink-0 relative">
              <VoteQRCode size={124} compact />
            </div>

            {/* Headline — center */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-2">
              <span className="text-center font-black text-ink leading-[1.1] text-[2.2rem] [text-shadow:0_2px_4px_rgba(0,0,0,0.55)]">
                Scan QR Code &amp; Support Your Team
              </span>
            </div>

            {/* FIFA 2026 logo — right (drop your image at public/fifa_2026.png) */}
            <div className="shrink-0 relative flex items-center justify-center h-full pr-1">
              {logoOk ? (
                <img
                  src={logoUrl}
                  onError={() => setLogoOk(false)}
                  alt="FIFA World Cup 2026"
                  className="max-h-[140px] max-w-[160px] object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                />
              ) : (
                <div className="flex flex-col items-center text-center leading-none">
                  <span className="text-[10px] tracking-[0.4em] text-muted">
                    FIFA
                  </span>
                  <span className="text-xl font-black tracking-tight text-ink [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
                    WORLD CUP
                  </span>
                  <span className="text-[1.6rem] font-black text-accent [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
                    2026
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 relative">
              <VoteQRCode matchId={match.id} size={124} compact />
            </div>

            <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2.5 text-[11px]">
                <span className="font-bold tracking-wide text-ink">
                  {TOURNAMENT.name}
                </span>
                <span className="text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {match.label}
                </span>
                <span
                  className={`ml-auto tabular-nums whitespace-nowrap ${
                    match.status === "IN_PLAY"
                      ? "text-accent font-bold"
                      : "text-white"
                  }`}
                >
                  {statusLine(match)} · {total.toLocaleString()}{" "}
                  {total === 1 ? "vote" : "votes"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
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
                      className="grid grid-cols-[88px_1fr] items-center gap-3"
                    >
                      <div className="relative w-[88px] h-[52px]">
                        {team.flag ? (
                          <img
                            className="w-[88px] h-[52px] object-cover rounded ring-1 ring-white/15"
                            src={team.flag}
                            alt={`${team.name} flag`}
                          />
                        ) : (
                          <span className="w-[88px] h-[52px] rounded bg-track text-muted font-extrabold flex items-center justify-center">
                            ?
                          </span>
                        )}
                        {goals != null && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-xs flex items-center justify-center tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                            {goals}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-bold text-[0.95rem] leading-tight text-ink truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                            {team.name}
                          </span>
                          <span
                            className={`ml-auto font-extrabold tabular-nums text-[0.95rem] ${
                              isLeader ? "text-green-400" : "text-ink"
                            }`}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-7 rounded-full overflow-hidden bg-black/20 border border-white/15 [box-shadow:inset_0_1px_3px_rgba(0,0,0,0.35)]">
                          <div
                            className="h-full rounded-full transition-[width] duration-700 ease-out [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.55),inset_0_-2px_3px_rgba(0,0,0,0.2)]"
                            style={{
                              width: `${pct}%`,
                              background:
                                "linear-gradient(180deg, rgba(226,229,236,0.95), rgba(150,156,176,0.92))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {slideCount > 1 && (
        <div
          className="flex gap-[7px] items-center"
          aria-label={`Slide ${index + 1} of ${slideCount}`}
        >
          {Array.from({ length: slideCount }).map((_, i) => (
            <span
              key={i}
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
