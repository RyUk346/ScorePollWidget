// Quick check: what's LIVE right now across the competitions your token can
// access? Handy for verifying the score/minute feed before the World Cup
// starts. Run with:  npm run live
import "dotenv/config";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
if (!TOKEN) {
  console.error("Missing FOOTBALL_DATA_TOKEN in .env");
  process.exit(1);
}

const res = await fetch("https://api.football-data.org/v4/matches?status=LIVE", {
  headers: { "X-Auth-Token": TOKEN },
});
if (!res.ok) {
  console.error(`football-data ${res.status} ${res.statusText}`);
  process.exit(1);
}

const { matches = [] } = await res.json();
if (!matches.length) {
  console.log("No matches are live right now in your plan's competitions.");
  console.log("Tip: try again during a fixture, or check a scheduled day with");
  console.log("  curl -H \"X-Auth-Token: $TOKEN\" 'https://api.football-data.org/v4/matches?status=LIVE'");
  process.exit(0);
}

for (const m of matches) {
  const ft = (m.score && m.score.fullTime) || {};
  const minute = m.minute ? `${m.minute}'` : m.status;
  console.log(
    `${m.competition.name}: ${m.homeTeam.shortName || m.homeTeam.name} ` +
      `${ft.home ?? 0}-${ft.away ?? 0} ` +
      `${m.awayTeam.shortName || m.awayTeam.name}  [${minute}]`
  );
}
