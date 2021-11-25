module.exports = {
  apps: [
    {
      name: 'crypto-server',
      script: 'dist/main.js',
    },
    // {
    //   name: 'every 5mins CronJobs',
    //   script: "crons/cronjob.js",
    //   instances: 1,
    //   exec_mode: 'fork',
    //   cron_restart: "0,30 * * * *",
    //   watch: false,
    //   autorestart: false
    // }
  ],
};
