#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/root/token_API}"
STATUS_FILE="${SMOKE_STATUS_FILE:-$PROJECT_DIR/output/runtime/qa-production-smoke-last-status.json}"
ALERT_WEBHOOK_URL="${SMOKE_ALERT_WEBHOOK_URL:-}"
ALERT_NAME="${SMOKE_ALERT_NAME:-MatrixAPI production smoke}"
ALERT_TIMEOUT_SECONDS="${SMOKE_ALERT_TIMEOUT_SECONDS:-10}"

usage() {
  cat <<'USAGE'
MatrixAPI production smoke alert sender

Usage:
  scripts/send-production-smoke-alert.sh [reason]

Environment:
  PROJECT_DIR=/root/token_API
  SMOKE_STATUS_FILE=/root/token_API/output/runtime/qa-production-smoke-last-status.json
  SMOKE_ALERT_WEBHOOK_URL=https://example.com/webhook
  SMOKE_ALERT_NAME="MatrixAPI production smoke"
  SMOKE_ALERT_TIMEOUT_SECONDS=10

Notes:
  If SMOKE_ALERT_WEBHOOK_URL is not set, the script logs that alert delivery is skipped and exits 0.
  The webhook receives a small JSON payload with status metadata only. Secrets are not included.
USAGE
}

json_string_value() {
  key="$1"
  if [ ! -f "$STATUS_FILE" ]; then
    return 0
  fi
  sed -n "s/^[[:space:]]*\"$key\"[[:space:]]*:[[:space:]]*\"\\(.*\\)\"[,]\\{0,1\\}[[:space:]]*$/\\1/p" "$STATUS_FILE" | head -n 1
}

json_number_value() {
  key="$1"
  if [ ! -f "$STATUS_FILE" ]; then
    return 0
  fi
  sed -n "s/^[[:space:]]*\"$key\"[[:space:]]*:[[:space:]]*\\([0-9][0-9]*\\)[,]\\{0,1\\}[[:space:]]*$/\\1/p" "$STATUS_FILE" | head -n 1
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

case "${1:-}" in
  --help|-h|help)
    usage
    exit 0
    ;;
esac

reason="${1:-smoke-status-failed}"
checked_at="$(json_string_value checkedAt)"
status_value="$(json_string_value status)"
exit_code="$(json_number_value exitCode)"
run_id="$(json_string_value runId)"
report_file="$(json_string_value reportFile)"
log_file="$(json_string_value logFile)"
sent_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ -z "$ALERT_WEBHOOK_URL" ]; then
  echo "SMOKE_ALERT skipped reason=no-webhook configuredReason=$reason status=${status_value:-unknown} exitCode=${exit_code:-unknown}"
  exit 0
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "SMOKE_ALERT failed reason=curl-missing"
  exit 1
fi

payload="$(cat <<JSON
{
  "name": "$(json_escape "$ALERT_NAME")",
  "reason": "$(json_escape "$reason")",
  "status": "$(json_escape "${status_value:-unknown}")",
  "exitCode": ${exit_code:-1},
  "checkedAt": "$(json_escape "${checked_at:-unknown}")",
  "sentAt": "$(json_escape "$sent_at")",
  "runId": "$(json_escape "${run_id:-unknown}")",
  "reportFile": "$(json_escape "${report_file:-unknown}")",
  "logFile": "$(json_escape "${log_file:-unknown}")"
}
JSON
)"

curl -fsS \
  --max-time "$ALERT_TIMEOUT_SECONDS" \
  -H 'content-type: application/json' \
  -X POST \
  --data "$payload" \
  "$ALERT_WEBHOOK_URL" >/dev/null

echo "SMOKE_ALERT sent reason=$reason status=${status_value:-unknown} exitCode=${exit_code:-unknown}"
