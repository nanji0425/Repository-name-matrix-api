#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/root/token_API}"
NODE_IMAGE="${NODE_IMAGE:-mcr.microsoft.com/playwright:v1.61.1-noble}"
LOG_DIR="${SMOKE_LOG_DIR:-$PROJECT_DIR/output/runtime}"
SMOKE_LOG_RETENTION_DAYS="${SMOKE_LOG_RETENTION_DAYS:-14}"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_FILE="$LOG_DIR/qa-production-smoke-$RUN_ID.log"
STATUS_FILE="$LOG_DIR/qa-production-smoke-$RUN_ID.status"
LAST_STATUS_FILE="$LOG_DIR/qa-production-smoke-last-status.json"
REPORT_FILE="$PROJECT_DIR/output/runtime/qa-production-smoke-report.json"

usage() {
  cat <<'USAGE'
MatrixAPI Dockerized production smoke runner

Usage:
  scripts/run-production-smoke-docker.sh [smoke options]

Examples:
  scripts/run-production-smoke-docker.sh
  scripts/run-production-smoke-docker.sh --list
  scripts/run-production-smoke-docker.sh --full --continue-on-fail

Environment:
  PROJECT_DIR=/root/token_API
  NODE_IMAGE=mcr.microsoft.com/playwright:v1.61.1-noble
  SMOKE_LOG_DIR=/root/token_API/output/runtime
  SMOKE_LOG_RETENTION_DAYS=14
  SMOKE_FULL=1
  SMOKE_CONTINUE_ON_FAIL=1
  SMOKE_DELAY_MS=2500
  SMOKE_HEAVY_DELAY_MS=9000
  SMOKE_SCRIPT_TIMEOUT_MS=240000
USAGE
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

write_last_status() {
  exit_code="$1"
  if [ "$exit_code" = "0" ]; then
    smoke_status="ok"
  else
    smoke_status="failed"
  fi

  checked_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  tmp_file="$LAST_STATUS_FILE.tmp"
  {
    printf '{\n'
    printf '  "checkedAt": "%s",\n' "$(json_escape "$checked_at")"
    printf '  "status": "%s",\n' "$(json_escape "$smoke_status")"
    printf '  "exitCode": %s,\n' "$exit_code"
    printf '  "runId": "%s",\n' "$(json_escape "$RUN_ID")"
    printf '  "projectDir": "%s",\n' "$(json_escape "$PROJECT_DIR")"
    printf '  "logFile": "%s",\n' "$(json_escape "$LOG_FILE")"
    printf '  "reportFile": "%s",\n' "$(json_escape "$REPORT_FILE")"
    printf '  "retentionDays": %s,\n' "$SMOKE_LOG_RETENTION_DAYS"
    printf '  "nodeImage": "%s"\n' "$(json_escape "$NODE_IMAGE")"
    printf '}\n'
  } > "$tmp_file"
  mv "$tmp_file" "$LAST_STATUS_FILE"
}

if [ "${1:-}" = "--wrapper-help" ]; then
  usage
  exit 0
fi

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Project directory does not exist: $PROJECT_DIR" >&2
  exit 1
fi

if [ ! -f "$PROJECT_DIR/scripts/qa-production-smoke.mjs" ]; then
  echo "Smoke script is missing: $PROJECT_DIR/scripts/qa-production-smoke.mjs" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run production smoke checks on this server." >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
find "$LOG_DIR" -maxdepth 1 -type f \( -name 'qa-production-smoke-*.log' -o -name 'qa-production-smoke-*.status' \) -mtime +"$SMOKE_LOG_RETENTION_DAYS" -delete 2>/dev/null || true

echo "MatrixAPI production smoke runner"
echo "Project: $PROJECT_DIR"
echo "Node image: $NODE_IMAGE"
echo "Log file: $LOG_FILE"
echo "Log retention: $SMOKE_LOG_RETENTION_DAYS days"

set +e
rm -f "$STATUS_FILE"
(
docker run --rm \
  -v "$PROJECT_DIR:/workspace" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker:ro \
  -v /usr/libexec/docker/cli-plugins:/usr/libexec/docker/cli-plugins:ro \
  -w /workspace \
  -e MATRIXAPI_URL="${MATRIXAPI_URL:-https://matrixapi.online}" \
  -e MATRIXAPI_HOST="${MATRIXAPI_HOST:-47.82.105.81}" \
  -e MATRIXAPI_LOCAL_DOCKER=1 \
  -e MATRIXAPI_LOCAL_SECRETS=1 \
  -e MATRIXAPI_PROJECT_DIR=/workspace \
  -e COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-token_api}" \
  -e PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/ms-playwright}" \
  -e SMOKE_FULL="${SMOKE_FULL:-}" \
  -e SMOKE_CONTINUE_ON_FAIL="${SMOKE_CONTINUE_ON_FAIL:-}" \
  -e SMOKE_DELAY_MS="${SMOKE_DELAY_MS:-}" \
  -e SMOKE_HEAVY_DELAY_MS="${SMOKE_HEAVY_DELAY_MS:-}" \
  -e SMOKE_SCRIPT_TIMEOUT_MS="${SMOKE_SCRIPT_TIMEOUT_MS:-}" \
  -e SMOKE_LOG_RETENTION_DAYS="$SMOKE_LOG_RETENTION_DAYS" \
  "$NODE_IMAGE" \
  sh -lc 'set -e; if [ ! -d node_modules/playwright ]; then npm ci --include=dev; fi; node scripts/qa-production-smoke.mjs "$@"' \
  smoke "$@"
run_status="$?"
echo "$run_status" > "$STATUS_FILE"
) 2>&1 | tee "$LOG_FILE"
status="$(cat "$STATUS_FILE" 2>/dev/null || echo 1)"
set -e

echo "Smoke exit code: $status"
write_last_status "$status"
echo "Report: $REPORT_FILE"
echo "Log: $LOG_FILE"
echo "Last status: $LAST_STATUS_FILE"

exit "$status"
