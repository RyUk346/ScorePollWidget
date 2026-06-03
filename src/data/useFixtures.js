import { useEffect, useState } from "react";
import { subscribeFixtures } from "../firebase.js";
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
 * Returns the live fixture list from Firebase (written by `npm run poll`) once
 * available, otherwise the static fallback so the app still runs offline /
 * before the poller is started.
 */
export function useFixtures() {
  const [live, setLive] = useState(null);
  useEffect(() => subscribeFixtures(setLive), []);
  return live && live.length ? normalize(live) : STATIC_FIXTURES;
}
