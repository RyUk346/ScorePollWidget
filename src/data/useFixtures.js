import { useEffect, useState } from "react";
import { subscribeFixtures, firebaseConfigured } from "../firebase.js";
import { FIXTURES as STATIC_FIXTURES, teamColor } from "./match.js";

// Live teams come from the poller as { code, name, flag }. Add the accent
// colour the UI needs so live and static fixtures share one shape.
function normalize(list) {
  return list.map((m) => ({
    ...m,
    teams: m.teams.map((t) => ({
      code: t.code ?? null,
      name: t.name || "TBD",
      flag: t.flag ?? null,
      color: teamColor(t.name || t.code || "?"),
    })),
  }));
}

/**
 * Returns `{ fixtures, loading }`.
 *
 * SINGLE SOURCE OF TRUTH: once the live poller's fixtures have been read from
 * Firebase, they are used for the rest of the session and are NEVER replaced by
 * the static fallback — not even if a later snapshot comes back empty. This is
 * what stops the UI oscillating between the live schedule (real kickoff dates)
 * and the built-in static schedule (approximate dates), which made the same
 * match appear on different days between refreshes.
 *
 *  - `loading` stays true until the first Firebase snapshot arrives, so neither
 *    dataset flashes mid-load. It's false immediately when Firebase isn't
 *    configured.
 *  - `fixtures` is the live list once it has ever arrived; otherwise the static
 *    fallback — used only when Firebase isn't configured, or the poller has
 *    never written any data.
 */
export function useFixtures() {
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    return subscribeFixtures((data) => {
      // Only ever adopt a non-empty live list, and never clear it once set.
      // A transient empty/missing snapshot must not knock us back to static.
      if (Array.isArray(data) && data.length) {
        setLive(normalize(data));
      }
      setLoading(false);
    });
  }, []);

  const fixtures = live ?? STATIC_FIXTURES;
  return { fixtures, loading };
}
