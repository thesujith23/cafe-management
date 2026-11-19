#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR/server"

PORT="${PORT:-5000}"
LOG="C:/Users/Sujith/AppData/Local/Temp/cafe-server.log"

echo "PROJECT_DIR=$PROJECT_DIR"
echo "PORT=$PORT"
echo "LOG=$LOG"

# Clear any stale log so we can see boot activity for this attempt
: > "$LOG"

# Start server in background, detached from this script
node src/server.js > "$LOG" 2>&1 &
SERVER_PID=$!
echo "SERVER_PID=$SERVER_PID"

# Give MongoDB + listen time to initialize
sleep 6

# Readiness check: try the chat endpoint once
HTTP_CODE=$(curl -sS -m 8 -o /dev/null -w "%{http_code}" \
  -X POST "http://localhost:$PORT/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"message":"hi"}' || echo "000")

echo "HTTP_CODE=$HTTP_CODE"

# Show latest boot lines regardless
echo "---- latest log ----"
tail -n 12 "$LOG"

# Save a small probe artifact back to the project root for the agent runtime
node - <<'NODE_SCRIPT'
const fs = require('fs');
const logPath = process.argv[2];
let log = '';
try { log = fs.readFileSync(logPath, 'utf8'); } catch {}
const httpCode = process.argv[3] || '000';
const port = (log.match(/running on port\s+(\d+)/i) || [])[1] || null;
const probe = {
  logPresent: !!log.trim(),
  hasPortAnnouncement: /running on port/i.test(log),
  detectedPort: port,
  hasMongodbOk: /MongoDB Connected/i.test(log),
  curlHttpCode: httpCode,
  lastLines: log.trim().split(/\r?\n/).slice(-10).join('\n'),
};
console.log(JSON.stringify(probe, null, 2));
fs.writeFileSync(process.argv[4], JSON.stringify(probe, null, 2));
NODE_SCRIPT "$LOG" "$HTTP_CODE" "$PROJECT_DIR/server/src/boot-probe.json"

# Keep this script alive only long enough to report readiness; the real server
# process is already backgrounded and disowned by the caller in this environment.
exit 0
