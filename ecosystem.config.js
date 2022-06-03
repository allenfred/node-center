module.exports = {
  apps: [
    {
      name: 'node-digger',
      script: 'dist/main.js',
    },
    {
      name: 'crypto-15mins',
      script: 'dist/crons/15mins.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0/15 * * * *',
      watch: false,
      autorestart: false,
    },
  ],
};
