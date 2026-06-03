// pm2 process config for the football-data poller.
// Start:  pm2 start deploy/ecosystem.config.cjs
// The poller reads .env (Firebase config + FOOTBALL_DATA_TOKEN) via dotenv,
// so make sure .env exists in the project root (cwd below).
module.exports = {
  apps: [
    {
      name: "wc-poller",
      script: "server/poll-worldcup.mjs",
      cwd: "/var/www/scorepoll",
      interpreter: "node",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      env: { NODE_ENV: "production" },
    },
  ],
};
