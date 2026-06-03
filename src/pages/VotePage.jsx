import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  TOURNAMENT,
  getUpcomingDaysAll,
  getMatchById,
  isVotingOpen,
} from "../data/match.js";
import { useFixtures } from "../data/useFixtures.js";
import MatchVoteCard from "../components/MatchVoteCard.jsx";

export default function VotePage() {
  const [params] = useSearchParams();
  const scannedId = params.get("m"); // the match whose QR was scanned (highlight)

  const allFixtures = useFixtures();
  const [now, setNow] = useState(() => Date.now());
  const [showClosed, setShowClosed] = useState(false);

  // Tick so locks apply live, and roll the day window over on its own.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const nowDate = new Date(now);
  const fixtures = getUpcomingDaysAll(allFixtures, nowDate, 2);

  // Ensure the scanned match is present even if it isn't on the active days.
  const scanned = getMatchById(allFixtures, scannedId);
  const all = fixtures.slice();
  if (scanned && !all.some((m) => m.id === scanned.id)) all.unshift(scanned);

  const byKickoff = (a, b) => new Date(a.kickoff) - new Date(b.kickoff);

  const open = all
    .filter((m) => isVotingOpen(m, nowDate))
    .sort((a, b) => (a.id === scannedId ? -1 : b.id === scannedId ? 1 : byKickoff(a, b)));
  const closed = all.filter((m) => !isVotingOpen(m, nowDate)).sort(byKickoff);

  return (
    <div className="max-w-[520px] mx-auto px-4 pt-5 pb-7 min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <span className="font-bold text-ink">{TOURNAMENT.name}</span>
        <span className="text-xs text-muted uppercase tracking-widest bg-panel border border-line px-2.5 py-1 rounded-full">
          Today &amp; tomorrow
        </span>
      </header>

      {all.length === 0 ? (
        <p className="text-center text-muted mt-10">
          No matches to vote on right now. Check back on a match day.
        </p>
      ) : (
        <>
          <p className="text-center text-muted text-sm mt-2 mb-[18px]">
            {open.length > 0
              ? `${open.length} match${open.length === 1 ? "" : "es"} open for voting`
              : "voting closed for these matches"}
          </p>

          {open.length > 0 && (
            <div className="flex flex-col gap-3.5">
              {open.map((m) => (
                <MatchVoteCard
                  key={m.id}
                  match={m}
                  now={now}
                  highlight={m.id === scannedId}
                />
              ))}
            </div>
          )}

          {closed.length > 0 && (
            <div className="mt-5">
              <button
                onClick={() => setShowClosed((s) => !s)}
                className="w-full flex items-center justify-between text-sm text-muted bg-panel border border-line rounded-xl px-3.5 py-2.5 hover:border-accent transition"
              >
                <span>
                  Finished / closed today ({closed.length})
                </span>
                <span className={`transition-transform ${showClosed ? "rotate-180" : ""}`}>
                  ⌄
                </span>
              </button>

              {showClosed && (
                <div className="flex flex-col gap-3.5 mt-3.5">
                  {closed.map((m) => (
                    <MatchVoteCard key={m.id} match={m} now={now} />
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-center text-muted mt-[18px]">
            Live results show on the main screen.{" "}
            <Link to="/" className="text-accent font-bold">
              View results
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
