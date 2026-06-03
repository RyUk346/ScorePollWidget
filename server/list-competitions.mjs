// Lists the competitions your football-data token can access, with their codes
// (use a code as FOOTBALL_DATA_COMPETITION). Run with:  npm run comps
import "dotenv/config";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
if (!TOKEN) {
  console.error("Missing FOOTBALL_DATA_TOKEN in .env");
  process.exit(1);
}

const res = await fetch("https://api.football-data.org/v4/competitions", {
  headers: { "X-Auth-Token": TOKEN },
});
if (!res.ok) {
  console.error(`football-data ${res.status} ${res.statusText}`);
  process.exit(1);
}

const { competitions = [] } = await res.json();
console.log(`Your token can access ${competitions.length} competitions:\n`);
for (const c of competitions) {
  console.log(
    `  ${String(c.code || "—").padEnd(6)} ${c.name}  (${c.area?.name || "?"})`
  );
}
console.log(
  "\nSet FOOTBALL_DATA_COMPETITION in .env to one of the codes above to poll it."
);
