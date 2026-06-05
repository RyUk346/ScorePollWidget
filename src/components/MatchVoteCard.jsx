import { useEffect, useState } from "react";
import { isVotingOpen, fmtKickoffUK } from "../data/match.js";
import { castVote, subscribeVotes } from "../firebase.js";

const votedKey = (id) => `wc-voted:${id}`;
const readVoted = (id) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(votedKey(id))) || []);
  } catch {
    return new Set();
  }
};

const showScore = (m) =>
  m.score && (m.status === "IN_PLAY" || m.status === "PAUSED" || m.status === "FINISHED");

/**
 * One match's voting block: two team options side by side. Voting is unlimited
 * (no per-device lock) and each tap opens a confirmation modal first. Voting
 * stays open until the match finishes; live score shows beside the flags.
 */
export default function MatchVoteCard({ match, now, highlight = false }) {
  const [votes, setVotes] = useState({});
  const [pending, setPending] = useState(null); // team awaiting confirmation
  const [submitting, setSubmitting] = useState(false);
  const [myVotes, setMyVotes] = useState(() => readVoted(match.id));

  useEffect(() => subscribeVotes(match.id, setVotes), [match.id]);

  const open = isVotingOpen(match, new Date(now));
  const scored = showScore(match);

  const confirm = async () => {
    if (!pending || submitting) return;
    setSubmitting(true);
    try {
      await castVote(match.id, pending.code);
      setMyVotes((prev) => {
        const next = new Set(prev).add(pending.code);
        localStorage.setItem(votedKey(match.id), JSON.stringify([...next]));
        return next;
      });
    } finally {
      setSubmitting(false);
      setPending(null);
    }
  };

  return (
    <div
      className={`bg-panel border rounded-2xl p-3.5 ${
        highlight ? "border-accent ring-2 ring-accent/35" : "border-line"
      }`}
    >
      <div className="flex items-center gap-2 mb-3 text-[0.78rem]">
        <span className="font-bold text-ink">{match.label}</span>
        <span className="ml-auto text-muted">{fmtKickoffUK(match.kickoff)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {match.teams.map((team, i) => {
          const voted = team.code && myVotes.has(team.code);
          const goals = scored ? (i === 0 ? match.score.home : match.score.away) : null;
          return (
            <button
              key={team.code || i}
              disabled={!open || submitting}
              onClick={() => setPending(team)}
              className={`relative flex flex-col items-center gap-2 bg-track border-2 rounded-xl px-2.5 py-3.5 text-ink transition enabled:hover:-translate-y-0.5 enabled:hover:border-accent enabled:cursor-pointer disabled:opacity-70 disabled:cursor-default ${
                voted ? "border-accent" : "border-line"
              }`}
            >
              <div className="relative">
                {team.flag ? (
                  <img
                    className="w-16 h-[43px] object-cover rounded-md shadow"
                    src={team.flag}
                    alt={`${team.name} flag`}
                  />
                ) : (
                  <span className="w-16 h-[43px] rounded-md bg-base/60 text-muted flex items-center justify-center font-extrabold">
                    ?
                  </span>
                )}
                {goals != null && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-md bg-base border border-line text-ink font-extrabold text-xs flex items-center justify-center tabular-nums">
                    {goals}
                  </span>
                )}
              </div>
              <span className="font-bold text-[0.95rem] text-center">
                {team.name}
              </span>
              {voted && (
                <span className="absolute top-2 right-2 w-[22px] h-[22px] rounded-full bg-accent text-white flex items-center justify-center text-[0.7rem]">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPending(null)}
        >
          <div
            className="bg-panel border border-line rounded-2xl p-5 w-full max-w-xs text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {pending.flag && (
              <img
                className="w-24 h-16 object-cover rounded-md mx-auto mb-3 shadow"
                src={pending.flag}
                alt={`${pending.name} flag`}
              />
            )}
            <p className="text-ink text-lg font-bold">Vote for {pending.name}?</p>
            <p className="text-muted text-sm mt-1">
              Are you sure you want to vote for {pending.name} to win this match?
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setPending(null)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-line text-muted py-2.5 hover:border-accent transition"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={submitting}
                className="flex-1 rounded-xl bg-accent text-white font-bold py-2.5 hover:brightness-110 transition disabled:opacity-60"
              >
                {submitting ? "Voting…" : "Yes, vote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
