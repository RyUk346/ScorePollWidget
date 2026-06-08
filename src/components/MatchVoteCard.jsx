import { isVotingOpen } from "../data/match.js";

const showScore = (m) =>
  m.score &&
  (m.status === "IN_PLAY" || m.status === "PAUSED" || m.status === "FINISHED");

/**
 * One match's pick block: two team options side by side. Selection is
 * controlled by the parent (VotePage) — tapping a team just selects it (toggle).
 * No vote is cast here; the parent submits all selections together.
 */
export default function MatchVoteCard({
  match,
  now,
  highlight = false,
  selected,
  onSelect,
}) {
  const open = isVotingOpen(match, new Date(now));
  const scored = showScore(match);

  return (
    <div
      className={`bg-panel border rounded-xl p-2.5 ${
        highlight ? "border-accent ring-2 ring-accent/35" : "border-line"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2 text-[0.62rem]">
        <span className="font-bold text-ink truncate min-w-0">{match.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {match.teams.map((team, i) => {
          const isSel = open && selected === team.code;
          const goals = scored
            ? i === 0
              ? match.score.home
              : match.score.away
            : null;
          return (
            <button
              key={team.code || i}
              disabled={!open}
              onClick={() => onSelect(match.id, team.code)}
              className={`relative flex flex-col items-center gap-1.5 border-2 rounded-lg px-1.5 py-2.5 text-ink transition enabled:hover:-translate-y-0.5 enabled:cursor-pointer disabled:opacity-70 disabled:cursor-default ${
                isSel
                  ? "border-accent bg-accent/15"
                  : "border-line bg-track enabled:hover:border-accent"
              }`}
            >
              <div className="relative">
                {team.flag ? (
                  <img
                    className="w-12 h-8 object-cover rounded shadow"
                    src={team.flag}
                    alt={`${team.name} flag`}
                  />
                ) : (
                  <span className="w-12 h-8 rounded bg-base/60 text-muted flex items-center justify-center font-extrabold">
                    ?
                  </span>
                )}
                {goals != null && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded bg-base border border-line text-ink font-extrabold text-[10px] flex items-center justify-center tabular-nums">
                    {goals}
                  </span>
                )}
              </div>
              <span className="font-bold text-[0.78rem] leading-tight text-center truncate max-w-full">
                {team.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
