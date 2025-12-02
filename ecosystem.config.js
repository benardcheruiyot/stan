// PM2 Ecosystem Configuration for Production
module.exports = {
  apps: [{
    name: 'app-production',
    script: 'backend/server.js',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3004
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3004
    },
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Memory and performance
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024',
    
    // Auto restart configuration
    autorestart: true,
    watch: false, // Disable in production
    max_restarts: 10,
    min_uptime: '10s',
    
    // Advanced features
    kill_timeout: 5000,
    listen_timeout: 3000,
    restart_delay: 4000,
    
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
};

// Optional: Deploy configuration for PM2 deploy
// module.exports.deploy = {
//   production: {
//     user: 'ubuntu',
//     host: 'your-server-ip',
//     ref: 'origin/main',
//     repo: 'git@github.com:yourusername/fundfast.git',
//     path: '/var/www/fundfast',
//     'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
//   }
// };