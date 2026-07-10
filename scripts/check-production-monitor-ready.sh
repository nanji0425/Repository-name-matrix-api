#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/root/token_API}"
SMOKE_MONITOR_ENV_FILE="${SMOKE_MONITOR_ENV_FILE:-$PROJECT_DIR/config/production-smoke-monitor.env}"
EXPECTED_CRON_SCRIPT="scripts/run-production-smoke-monitor.sh"
STRICT_ALERTS=0
failures=0
warnings=0

usage() {
  cat <<'USAGE'
MatrixAPI production monitor readiness audit

Usage:
  scripts/check-production-monitor-ready.sh [--strict-alerts]

Environment:
  PROJECT_DIR=/root/token_API
  SMOKE_MONITOR_ENV_FILE=/root/token_API/config/production-smoke-monitor.env

Options:
  --strict-alerts  Treat missing/loose alert configuration as FAIL instead of WARN.

Exit codes:
  0  required production monitor checks passed
  1  one or more required checks failed

Notes:
  By default, missing SMOKE_ALERT_WEBHOOK_URL is reported as WARN, not FAIL.
  Use --strict-alerts as a release gate when external alert delivery must be configured.
  Webhook values are never printed.
USAGE
}

pass() {
  echo "PASS $1"
}

warn() {
  warnings=$((warnings + 1))
  echo "WARN $1"
}

fail() {
  failures=$((failures + 1))
  echo "FAIL $1"
}

alert_warn_or_fail() {
  if [ "$STRICT_ALERTS" -eq 1 ]; then
    fail "$1"
  else
    warn "$1"
  fi
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h|help)
      usage
      exit 0
      ;;
    --strict-alerts)
      STRICT_ALERTS=1
      ;;
    *)
      echo "Unknown command: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if [ ! -d "$PROJECT_DIR" ]; then
  fail "project_dir_missing path=$PROJECT_DIR"
else
  pass "project_dir_exists path=$PROJECT_DIR"
fi

for script in \
  scripts/run-production-smoke-docker.sh \
  scripts/run-production-smoke-monitor.sh \
  scripts/check-production-smoke-status.sh \
  scripts/send-production-smoke-alert.sh \
  scripts/install-production-smoke-cron.sh
do
  if [ -x "$PROJECT_DIR/$script" ]; then
    pass "script_executable path=$script"
  else
    fail "script_not_executable path=$script"
  fi
done

if "$PROJECT_DIR/scripts/check-production-smoke-status.sh" >/tmp/matrixapi-monitor-status-check.out 2>&1; then
  pass "latest_smoke_status_ok"
else
  fail "latest_smoke_status_failed detail=$(cat /tmp/matrixapi-monitor-status-check.out 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')"
fi
rm -f /tmp/matrixapi-monitor-status-check.out

if command -v crontab >/dev/null 2>&1; then
  cron_text="$(crontab -l 2>/dev/null || true)"
  if printf '%s\n' "$cron_text" | grep -F "$EXPECTED_CRON_SCRIPT" >/dev/null 2>&1; then
    pass "cron_uses_monitor_script"
  else
    fail "cron_missing_monitor_script"
  fi

  if printf '%s\n' "$cron_text" | grep -F "SMOKE_MONITOR_ENV_FILE=" >/dev/null 2>&1; then
    pass "cron_sets_monitor_env_file"
  else
    warn "cron_env_file_not_explicit"
  fi
else
  fail "crontab_missing"
fi

cron_service_state="$(
  systemctl is-active crond 2>/dev/null ||
  systemctl is-active cron 2>/dev/null ||
  true
)"
case "$cron_service_state" in
  active*)
    pass "cron_service_active"
    ;;
  *)
    fail "cron_service_not_active state=${cron_service_state:-unknown}"
    ;;
esac

if [ -f "$SMOKE_MONITOR_ENV_FILE" ]; then
  permissions="$(ls -l "$SMOKE_MONITOR_ENV_FILE" | awk '{print $1}')"
  case "$permissions" in
    -rw-------|-r--------)
      pass "monitor_env_file_permissions_restricted path=$SMOKE_MONITOR_ENV_FILE"
      ;;
    *)
      alert_warn_or_fail "monitor_env_file_permissions_loose path=$SMOKE_MONITOR_ENV_FILE mode=$permissions"
      ;;
  esac

  if grep -E '^[[:space:]]*SMOKE_ALERT_WEBHOOK_URL=.+' "$SMOKE_MONITOR_ENV_FILE" >/dev/null 2>&1; then
    pass "alert_webhook_configured"
  else
    alert_warn_or_fail "alert_webhook_not_configured"
  fi
else
  alert_warn_or_fail "monitor_env_file_missing path=$SMOKE_MONITOR_ENV_FILE"
  alert_warn_or_fail "alert_webhook_not_configured"
fi

echo "SUMMARY failures=$failures warnings=$warnings strictAlerts=$STRICT_ALERTS"

if [ "$failures" -gt 0 ]; then
  exit 1
fi
