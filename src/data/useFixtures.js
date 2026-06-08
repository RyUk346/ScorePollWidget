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
 *  - `loading` is true until the first Firebase snapshot arrives (so the static
 *    fallback never flashes while live data is loading). It's false immediately
 *    when Firebase isn't configured.
 *  - `fixtures` is the live list once available, else the static fallback.
 */
export function useFixtures() {
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    return subscribeFixtures((data) => {
      setLive(data);
      setLoading(false);
    });
  }, []);

  const fixtures =
    live && live.length ? normalize(live) : STATIC_FIXTURES;
  return { fixtures, loading };
}
