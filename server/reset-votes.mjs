// Reset poll votes in Firebase.
//   npm run reset-votes            -> clears ALL matches (the whole polls node)
//   npm run reset-votes -- <id>    -> clears only that match's votes
import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, remove } from "firebase/database";

const cfg = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
if (!cfg.databaseURL) {
  console.error("Missing VITE_FIREBASE_DATABASE_URL in .env");
  process.exit(1);
}

const db = getDatabase(initializeApp(cfg));
const matchId = process.argv[2];
const path = matchId ? `polls/${matchId}/votes` : "polls";

await remove(ref(db, path));
console.log(`Cleared ${path}`);
process.exit(0);
