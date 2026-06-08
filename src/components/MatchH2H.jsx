import { useEffect, useState } from "react";
import { fmtKickoffUK } from "../data/match.js";
import { subscribeVotes } from "../firebase.js";

const statusLine = (m) => {
  if (m.status === "IN_PLAY") return m.minute ? `LIVE ${m.minute}'` : "LIVE";
  if (m.status === "PAUSED") return "HT";
  if (m.status === "FINISHED") return "FT";
  return fmtKickoffUK(m.kickoff);
};

const liveScore = (m) =>
  m.score && ["IN_PLAY", "PAUSED", "FINISHED"].includes(m.status)
    ? m.score
    : null;

function Flag({ team, goals }) {
  return (
    <div className="relative shrink-0">
      {team.flag ? (
        <img
          src={team.flag}
          alt={`${team.name} flag`}
          className="w-12 h-8 object-cover rounded ring-1 ring-white/15 [.big_&]:w-24 [.big_&]:h-16 [.big_&]:rounded-lg"
        />
      ) : (
        <span className="w-12 h-8 rounded bg-black/30 text-muted flex items-center justify-center font-extrabold [.big_&]:w-24 [.big_&]:h-16">
          ?
        </span>
      )}
      {goals != null && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-[10px] flex items-center justify-center tabular-nums [.big_&]:-top-2.5 [.big_&]:-right-2.5 [.big_&]:min-w-[34px] [.big_&]:h-9 [.big_&]:text-xl [.big_&]:rounded-lg">
          {goals}
        </span>
      )}
    </div>
  );
}

/**
 * Compact head-to-head card: two flags at the ends with a single split bar
 * showing the vote share, plus team names + percentages. Designed to stack two
 * per column in the widget. Self-subscribes to its match's live votes.
 */
export default function MatchH2H({ match }) {
  const [votes, setVotes] = useState({});
  useEffect(() => subscribeVotes(match.id, setVotes), [match.id]);

  const [a, b] = match.teams;
  const va = votes[a.code] || 0;
  const vb = votes[b.code] || 0;
  const total = va + vb;
  const pa = total ? Math.round((va / total) * 100) : 50;
  const pb = total ? 100 - pa : 50;
  const score = liveScore(match);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 [.big_&]:px-6 [.big_&]:py-4 [.big_&]:rounded-3xl">
      <div className="flex items-center justify-between gap-2 text-[10px] mb-1.5 [.big_&]:text-[18px] [.big_&]:mb-3">
        <span className="font-bold text-white/80 truncate">{match.label}</span>
        <span
          className={`shrink-0 ${
            match.status === "IN_PLAY" ? "text-accent font-bold" : "text-muted"
          }`}
        >
          {statusLine(match)}
        </span>
      </div>

      <div className="flex items-center gap-2 [.big_&]:gap-4">
        <Flag team={a} goals={score ? score.home : null} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1 text-[0.78rem] [.big_&]:text-[1.5rem] [.big_&]:mb-2">
            <span className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-bold text-ink truncate">{a.name}</span>
              <span
                className={`shrink-0 font-extrabold tabular-nums ${
                  pa >= pb ? "text-green-400" : "text-ink"
                }`}
              >
                {pa}%
              </span>
            </span>
            <span className="flex items-baseline gap-1.5 min-w-0 justify-end">
              <span
                className={`shrink-0 font-extrabold tabular-nums ${
                  pb > pa ? "text-green-400" : "text-ink"
                }`}
              >
                {pb}%
              </span>
              <span className="font-bold text-ink truncate">{b.name}</span>
            </span>
          </div>

          <div className="flex h-3 rounded-full overflow-hidden bg-black/30 border border-white/10 [.big_&]:h-6">
            <div
              className="transition-[width] duration-700 ease-out"
              style={{
                width: `${pa}%`,
                background:
                  "linear-gradient(90deg, rgba(232,235,242,0.95), rgba(176,182,200,0.92))",
              }}
            />
            <div className="w-px bg-black/50" />
            <div
              className="transition-[width] duration-700 ease-out"
              style={{
                width: `${pb}%`,
                background:
                  "linear-gradient(90deg, rgba(140,146,168,0.92), rgba(96,102,128,0.92))",
              }}
            />
          </div>
        </div>

        <Flag team={b} goals={score ? score.away : null} />
      </div>
    </div>
  );
}
