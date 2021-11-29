module.exports = {
  apps: [
    {
      name: 'crypto-server',
      script: 'dist/main.js',
    },
    {
      name: 'crypto-5mins',
      script: 'dist/crons/5min.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0/5 * * * *',
      watch: false,
      autorestart: false,
    },
  ],
};
