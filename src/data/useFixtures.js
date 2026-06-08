import { useEffect, useState } from "react";
import { subscribeFixtures, firebaseConfigured } from "../firebase.js";
import { teamColor } from "./match.js";

// Live teams come from the poller as { code, name, flag }. Add the accent
// colour the UI needs.
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
 * LIVE DATA ONLY. The fixtures always come from the football-data poller via
 * Firebase (`worldcup/fixtures`). There is intentionally no static fallback —
 * mixing a built-in approximate schedule with the live one made the same match
 * appear on different days. Until the first live snapshot arrives, `fixtures`
 * is an empty array and `loading` is true so the UI shows its loader/empty
 * state instead of a second dataset.
 *
 *  - `live` is only ever set to a non-empty list and is never cleared, so a
 *    transient empty/missing snapshot won't blank the UI.
 */
export function useFixtures() {
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    return subscribeFixtures((data) => {
      if (Array.isArray(data) && data.length) {
        setLive(normalize(data));
      }
      setLoading(false);
    });
  }, []);

  return { fixtures: live ?? [], loading };
}
