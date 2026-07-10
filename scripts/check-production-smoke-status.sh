#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/root/token_API}"
STATUS_FILE="${SMOKE_STATUS_FILE:-$PROJECT_DIR/output/runtime/qa-production-smoke-last-status.json}"
SMOKE_MAX_AGE_MINUTES="${SMOKE_MAX_AGE_MINUTES:-390}"

usage() {
  cat <<'USAGE'
MatrixAPI production smoke status checker

Usage:
  scripts/check-production-smoke-status.sh

Environment:
  PROJECT_DIR=/root/token_API
  SMOKE_STATUS_FILE=/root/token_API/output/runtime/qa-production-smoke-last-status.json
  SMOKE_MAX_AGE_MINUTES=390

Exit codes:
  0  latest smoke status is ok and fresh
  1  latest smoke status is missing, stale, failed, or malformed
USAGE
}

json_string_value() {
  key="$1"
  sed -n "s/^[[:space:]]*\"$key\"[[:space:]]*:[[:space:]]*\"\\(.*\\)\"[,]\\{0,1\\}[[:space:]]*$/\\1/p" "$STATUS_FILE" | head -n 1
}

json_number_value() {
  key="$1"
  sed -n "s/^[[:space:]]*\"$key\"[[:space:]]*:[[:space:]]*\\([0-9][0-9]*\\)[,]\\{0,1\\}[[:space:]]*$/\\1/p" "$STATUS_FILE" | head -n 1
}

fail() {
  echo "SMOKE_STATUS failed reason=$1 checkedAt=${checked_at:-unknown} status=${status_value:-unknown} exitCode=${exit_code:-unknown} ageMinutes=${age_minutes:-unknown} report=${report_file:-unknown}"
  exit 1
}

case "${1:-}" in
  --help|-h|help)
    usage
    exit 0
    ;;
  '')
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage >&2
    exit 1
    ;;
esac

if [ ! -f "$STATUS_FILE" ]; then
  fail "missing-status-file"
fi

checked_at="$(json_string_value checkedAt)"
status_value="$(json_string_value status)"
exit_code="$(json_number_value exitCode)"
report_file="$(json_string_value reportFile)"
log_file="$(json_string_value logFile)"

if [ -z "$checked_at" ] || [ -z "$status_value" ] || [ -z "$exit_code" ] || [ -z "$report_file" ]; then
  fail "malformed-status-file"
fi

if [ "$status_value" != "ok" ] || [ "$exit_code" != "0" ]; then
  fail "smoke-failed"
fi

if [ ! -f "$report_file" ]; then
  fail "missing-report-file"
fi

checked_epoch="$(date -u -d "$checked_at" +%s 2>/dev/null || true)"
now_epoch="$(date -u +%s)"
if [ -z "$checked_epoch" ]; then
  fail "invalid-checked-at"
fi

age_minutes="$(( (now_epoch - checked_epoch) / 60 ))"
if [ "$age_minutes" -lt 0 ]; then
  fail "future-status-file"
fi

if [ "$age_minutes" -gt "$SMOKE_MAX_AGE_MINUTES" ]; then
  fail "stale-status-file"
fi

echo "SMOKE_STATUS ok checkedAt=$checked_at ageMinutes=$age_minutes maxAgeMinutes=$SMOKE_MAX_AGE_MINUTES report=$report_file log=${log_file:-unknown}"
