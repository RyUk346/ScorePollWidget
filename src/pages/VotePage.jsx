import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getUpcomingDaysAll, getMatchById } from "../data/match.js";
import { useFixtures } from "../data/useFixtures.js";
import { castVote } from "../firebase.js";
import CAROUSEL_IMAGES from "../data/carousel.js";
import MatchVoteCard from "../components/MatchVoteCard.jsx";
import ClientSlider from "../components/ClientSlider.jsx";
import Carousel from "../components/Carousel.jsx";
import Loader from "../components/Loader.jsx";

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

export default function VotePage() {
  const [params] = useSearchParams();
  const scannedId = params.get("m");

  const { fixtures: allFixtures, loading } = useFixtures();
  const [now, setNow] = useState(() => Date.now());
  const [selections, setSelections] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const nowDate = new Date(now);
  const fixtures = getUpcomingDaysAll(allFixtures, nowDate, 2);
  const scanned = getMatchById(allFixtures, scannedId);
  const all = fixtures.slice();
  if (scanned && !all.some((m) => m.id === scanned.id)) all.unshift(scanned);

  const byKickoff = (a, b) => new Date(a.kickoff) - new Date(b.kickoff);
  all.sort(byKickoff);

  // Group into distinct match-days (today + tomorrow).
  const dayGroups = [];
  for (const m of all) {
    const d = ukDay(m.kickoff);
    let g = dayGroups.find((x) => x.day === d);
    if (!g) {
      g = { day: d, matches: [] };
      dayGroups.push(g);
    }
    g.matches.push(m);
  }
  const todayKey = ukDay(nowDate);
  const tmrw = new Date(nowDate);
  tmrw.setDate(tmrw.getDate() + 1);
  const tomorrowKey = ukDay(tmrw);
  const groupLabel = (g) =>
    g.day === todayKey
      ? "Today"
      : g.day === tomorrowKey
        ? "Tomorrow"
        : ukDateLabel(g.matches[0].kickoff);

  const select = (matchId, code) =>
    setSelections((prev) => {
      const next = { ...prev };
      if (next[matchId] === code) delete next[matchId];
      else next[matchId] = code;
      return next;
    });

  const picks = Object.entries(selections);
  const pickList = picks
    .map(([matchId, code]) => {
      const m = all.find((x) => x.id === matchId);
      const team = m?.teams.find((t) => t.code === code);
      return m && team ? { matchId, label: m.label, team: team.name } : null;
    })
    .filter(Boolean);

  const submit = async () => {
    if (!picks.length || submitting) return;
    setSubmitting(true);
    try {
      await Promise.all(
        picks.map(([matchId, code]) => castVote(matchId, code)),
      );
      setSubmitted(true);
      setSelections({});
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const logo = (name) => `${import.meta.env.BASE_URL}${name}`;

  const dayGrid = (g) => (
    <section key={g.day}>
      <h2 className="text-sm font-bold text-gray-900 mb-2">
        {groupLabel(g)}{" "}
        <span className="text-gray-400 font-medium">
          · {ukDateLabel(g.matches[0].kickoff)}
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {g.matches.map((m) => (
          <MatchVoteCard
            key={m.id}
            match={m}
            now={now}
            highlight={m.id === scannedId}
            selected={selections[m.id]}
            onSelect={select}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="vote-page bg-[#FBF7EE] min-h-screen w-full overflow-x-hidden text-gray-900">
      <div className="max-w-[640px] mx-auto px-4 py-3 min-h-screen flex flex-col gap-2">
        {/* Header: title left, World Cup logo right */}
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 pb-1">
          <div className="leading-none">
            <span className="block text-[11px] tracking-[0.35em] text-gray-400">
              FIFA
            </span>
            <span className="block text-xl font-black text-gray-900">
              World Cup 2026
            </span>
          </div>
          <img
            src={logo("fifa2026_black.webp")}
            alt="FIFA World Cup 2026"
            className="h-16 overflow-hidden object-contain"
          />
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader />
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
            <div className="w-16 h-16 rounded-full bg-green-100 border border-green-500 flex items-center justify-center text-green-600 text-3xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Thanks for voting!
            </h1>
            <p className="text-gray-500 text-sm max-w-xs">
              Your votes have been counted. Refresh the page or scan the QR code
              again to vote once more.
            </p>
          </div>
        ) : all.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No matches to vote on right now. Check back on a match day.
          </p>
        ) : (
          <>
            {dayGroups[0] && dayGrid(dayGroups[0])}
            {dayGroups[1] && dayGrid(dayGroups[1])}

            {/* Vote Now (left) + Powered by HyperGlow (right) */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => picks.length && setConfirmOpen(true)}
                disabled={picks.length === 0}
                className="vp-vote-btn w-[200px] justify-center group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-b from-[#C2683E] to-[#A8522E] px-7 py-3 font-bold text-white shadow-lg shadow-[#C2683E]/35 ring-1 ring-inset ring-white/20 transition-all duration-200 hover:from-[#CE744A] hover:to-[#B85B34] hover:shadow-xl hover:shadow-[#C2683E]/45 active:scale-[0.97] disabled:cursor-default disabled:from-[#E0C9B2] disabled:to-[#E0C9B2] disabled:text-[#8C7D6F] disabled:shadow-none disabled:ring-[#EAD7C4]"
              >
                {/* <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg> */}
                <span>Vote Now</span>
                {picks.length > 0 && (
                  <span className="ml-0.5 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white/25 px-1.5 text-sm font-extrabold tabular-nums">
                    {picks.length}
                  </span>
                )}
              </button>
              <a
                href="https://hyperglow.co.uk/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex flex-col items-center mt-1 -gap-2">
                  <span className="text-[12px] tracking-widest font-semibold text-[#5D5F5C] -mb-2 ml-6">
                    Powered by
                  </span>
                  <img
                    src={logo("hyperglow-logo.webp")}
                    alt="HyperGlow"
                    className="h-9 object-contain"
                  />
                </div>
              </a>
            </div>
          </>
        )}

        {/* Carousel — always on, exactly like the client marquee: shown in
            every state including loading, no-match, voting and after submit. */}
        <div className="rounded-2xl bg-[#ffe9dc] p-2 mt-5">
          <Carousel images={CAROUSEL_IMAGES} intervalMs={2000} />
        </div>

        {/* Client marquee — full bleed to the screen edges (breaks out of the
            centred max-w container via the w-screen + left-1/2 trick). */}
        <div className="mt-auto w-screen relative left-1/2 -translate-x-1/2 bg-white border-t border-[#EAD7C4]">
          <ClientSlider />
        </div>
      </div>

      {/* Confirm-all modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1715]/50 p-4"
          onClick={() => !submitting && setConfirmOpen(false)}
        >
          <div
            className="bg-[#F9E9DE] border border-[#EAD7C4] rounded-2xl p-5 w-full max-w-sm shadow-2xl shadow-[#1A1715]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[#1A1715] text-lg font-bold text-center">
              Confirm your votes
            </h2>
            <p className="text-[#8C7D6F] text-sm text-center mt-1">
              You're voting for:
            </p>
            <ul className="my-4 max-h-56 overflow-auto flex flex-col gap-2">
              {pickList.map((p) => (
                <li
                  key={p.matchId}
                  className="flex items-center justify-between gap-3 bg-[#F9E6D7] border border-[#E0C9B2] rounded-lg px-3 py-2"
                >
                  <span className="text-[0.7rem] text-[#8C7D6F] truncate">
                    {p.label}
                  </span>
                  <span className="font-bold text-[#1A1715] text-sm shrink-0">
                    {p.team}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-[#D9BFA6] text-[#8C7D6F] py-2.5 hover:border-[#C2683E] hover:text-[#1A1715] transition"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-[#C2683E] text-white font-bold py-2.5 hover:brightness-110 transition disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
