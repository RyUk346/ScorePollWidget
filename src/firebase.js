import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  runTransaction,
} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only when .env holds REAL values (not the "your-..." placeholders from
// .env.example). Otherwise the UI falls back to a local demo mode so the
// project still runs before Firebase is configured.
const isPlaceholder = (v) =>
  !v || /^your-/i.test(v) || /your-project|000000000000/.test(v);

export const firebaseConfigured =
  !isPlaceholder(firebaseConfig.apiKey) &&
  !isPlaceholder(firebaseConfig.databaseURL);

let db = null;
if (firebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
}

/**
 * Subscribe to live vote tallies for one match. `callback` receives an object
 * like { ar: 12, fr: 9 }. Returns an unsubscribe function.
 *
 * When Firebase is not configured, falls back to a cross-tab local store so
 * the demo still works (votes sync between tabs on the same browser).
 */
export function subscribeVotes(matchId, callback) {
  if (!firebaseConfigured) return localStore.subscribe(matchId, callback);

  return onValue(ref(db, `polls/${matchId}/votes`), (snapshot) => {
    callback(snapshot.val() || {});
  });
}

/** Atomically increment the tally for one team in one match. */
export function castVote(matchId, teamCode) {
  if (!firebaseConfigured) return localStore.cast(matchId, teamCode);

  const teamRef = ref(db, `polls/${matchId}/votes/${teamCode}`);
  return runTransaction(teamRef, (current) => (current || 0) + 1);
}

/**
 * Subscribe to EVERY match's vote tallies at once (for the results page).
 * Calls back with a flattened map: { [matchId]: { [teamCode]: count } }.
 * Returns an unsubscribe function.
 */
export function subscribeAllVotes(callback) {
  if (!firebaseConfigured) return localStore.subscribeAll(callback);

  return onValue(ref(db, "polls"), (snapshot) => {
    const raw = snapshot.val() || {};
    const out = {};
    for (const [matchId, node] of Object.entries(raw)) {
      out[matchId] = (node && node.votes) || {};
    }
    callback(out);
  });
}

/**
 * Subscribe to the live fixture list written by the football-data poller
 * (`npm run poll`) at `worldcup/fixtures`. Calls back with an array, or null
 * when Firebase isn't configured / no data yet — callers fall back to the
 * static fixtures in that case. Returns an unsubscribe function.
 */
export function subscribeFixtures(callback) {
  if (!firebaseConfigured) {
    callback(null);
    return () => {};
  }
  return onValue(ref(db, "worldcup/fixtures"), (snapshot) => {
    callback(snapshot.val() || null);
  });
}

/* ----------------------------------------------------------------------- *
 * Local fallback (no Firebase): persists to localStorage and syncs across
 * tabs via the `storage` event + BroadcastChannel. Purely for demoing.
 * ----------------------------------------------------------------------- */
const lsKey = (matchId) => `wc-poll:${matchId}`;
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("wc-poll")
    : null;

const localStore = {
  read(matchId) {
    try {
      return JSON.parse(localStorage.getItem(lsKey(matchId))) || {};
    } catch {
      return {};
    }
  },
  write(matchId, votes) {
    localStorage.setItem(lsKey(matchId), JSON.stringify(votes));
    channel?.postMessage(matchId);
  },
  cast(matchId, teamCode) {
    const votes = this.read(matchId);
    votes[teamCode] = (votes[teamCode] || 0) + 1;
    this.write(matchId, votes);
    return Promise.resolve();
  },
  subscribe(matchId, callback) {
    const emit = () => callback(this.read(matchId));
    emit();
    const onStorage = (e) => {
      if (e.key === lsKey(matchId)) emit();
    };
    window.addEventListener("storage", onStorage);
    const onMsg = (e) => {
      if (e.data === matchId) emit();
    };
    channel?.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.removeEventListener("message", onMsg);
    };
  },
  readAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wc-poll:")) {
        out[key.slice("wc-poll:".length)] = this.read(key.slice("wc-poll:".length));
      }
    }
    return out;
  },
  subscribeAll(callback) {
    const emit = () => callback(this.readAll());
    emit();
    const onStorage = (e) => {
      if (e.key && e.key.startsWith("wc-poll:")) emit();
    };
    window.addEventListener("storage", onStorage);
    const onMsg = () => emit();
    channel?.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.removeEventListener("message", onMsg);
    };
  },
};
