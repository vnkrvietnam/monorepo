// PM2 Ecosystem — VNKR Tech Holding Monorepo
// Usage:
//   pm2 start ecosystem.config.cjs               # start tất cả
//   pm2 start ecosystem.config.cjs --only api-gateway
//   pm2 restart ecosystem.config.cjs             # restart tất cả
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/

const dir = "/var/www";
const log = "/var/log/pm2";

/** Helper for Next.js app processes */
const nextApp = (name, appDir, port) => ({
  name,
  cwd        : `${dir}/apps/${appDir}`,
  script     : "node_modules/.bin/next",
  args       : `start -p ${port}`,
  interpreter: "none",
  instances  : 1,
  exec_mode  : "fork",
  autorestart: true,
  watch      : false,
  max_memory_restart: "512M",
  env: {
    NODE_ENV : "production",
    PORT     : String(port),
    HOSTNAME : "127.0.0.1",
  },
  error_file     : `${log}/${name}-err.log`,
  out_file       : `${log}/${name}-out.log`,
  log_date_format: "YYYY-MM-DD HH:mm:ss Z",
});

/** Helper for Node.js service processes */
const svc = (name, svcDir, script, port, maxMem = "256M") => ({
  name,
  cwd        : `${dir}/services/${svcDir}`,
  script,
  interpreter: "node",
  instances  : 1,
  exec_mode  : "fork",
  autorestart: true,
  watch      : false,
  max_memory_restart: maxMem,
  env: {
    NODE_ENV : "production",
    PORT     : String(port),
  },
  env_file       : `${dir}/.env.production`,
  error_file     : `${log}/${name}-err.log`,
  out_file       : `${log}/${name}-out.log`,
  log_date_format: "YYYY-MM-DD HH:mm:ss Z",
});

module.exports = {
  apps: [
    // ┌──────────────────────────────────────────────────────────────────┐
    // │  BACKEND SERVICES                                                │
    // ├──────────────────────────────────────────────────────────────────┤
    svc("api-gateway",      "api-gateway",      "dist/index.js",              5000, "512M"),
    svc("ws-gateway",       "api-gateway",      "dist/websocket/index.js",    5001, "256M"),
    svc("deposit-worker",   "api-gateway",      "dist/workers/index.js",      5002, "256M"),
    svc("fiat-connector",   "fiat-connector-api","dist/index.js",             4001, "128M"),
    svc("swift-gateway",    "swift-gateway",    "dist/index.js",              4002, "128M"),
    // ├──────────────────────────────────────────────────────────────────┤
    // │  ROLE ENGINE — Global Leadership Automation Worker               │
    // ├──────────────────────────────────────────────────────────────────┤
    {
      name              : "role-engine",
      cwd               : `${dir}/services/role-engine`,
      script            : "role-engine.js",
      interpreter       : "node",
      instances         : 1,
      exec_mode         : "fork",
      autorestart       : true,
      watch             : false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV            : "production",
        LOG_LEVEL           : "info",
        TRIGGER_INTERVAL_MS : "5000",
      },
      error_file     : `${log}/role-engine-err.log`,
      out_file       : `${log}/role-engine-out.log`,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs     : true,
      restart_delay  : 3000,
    },
    // ├──────────────────────────────────────────────────────────────────┤
    // │  FRONTEND APPS                                                   │
    // ├──────────────────────────────────────────────────────────────────┤
    nextApp("app-web",        "app-web",               3010), // app.vnkr.vn
    nextApp("pay-portal",     "pay-portal",            3002), // pay.vnkr.vn
    nextApp("explorer",       "explorer-vnkrscan",     3003), // scan.vnkr.vn
    nextApp("swap-dex",       "swap-dex",              3004), // swap.vnkr.vn
    nextApp("dao-portal",     "dao-portal",            3005), // dao.vnkr.vn
    nextApp("holding-admin",  "holding-admin-portal",  3006), // holding.vnkr.vn
    nextApp("id-fiat",        "id-fiat-gateway",       3001), // id.vnkr.vn
    nextApp("kyc-portal",     "kyc-portal",            3013), // kyc.vnkr.vn
    nextApp("merchant",       "merchant-portal",       3011), // merchant.vnkr.vn
    nextApp("sandbox",        "sandbox-dashboard",     3012), // sandbox.vnkr.vn
    // └──────────────────────────────────────────────────────────────────┘
  ],
};
