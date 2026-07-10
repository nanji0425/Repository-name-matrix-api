#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/root/token_API}"
SMOKE_LOG_RETENTION_DAYS="${SMOKE_LOG_RETENTION_DAYS:-14}"
SMOKE_MONITOR_ENV_FILE="${SMOKE_MONITOR_ENV_FILE:-$PROJECT_DIR/config/production-smoke-monitor.env}"

usage() {
  cat <<'USAGE'
MatrixAPI production smoke monitor

Usage:
  scripts/run-production-smoke-monitor.sh [smoke options]

Environment:
  PROJECT_DIR=/root/token_API
  SMOKE_MONITOR_ENV_FILE=/root/token_API/config/production-smoke-monitor.env
  SMOKE_LOG_RETENTION_DAYS=14
  SMOKE_ALERT_WEBHOOK_URL=https://example.com/webhook
  SMOKE_MAX_AGE_MINUTES=390

Behavior:
  Runs the Dockerized production smoke suite, checks the latest status file, and sends an optional webhook alert on failure.
  If SMOKE_MONITOR_ENV_FILE exists, it is loaded before the smoke run. Keep real webhook URLs in that file, not in source or crontab.
USAGE
}

case "${1:-}" in
  --help|-h|help)
    usage
    exit 0
    ;;
esac

cd "$PROJECT_DIR"

if [ -f "$SMOKE_MONITOR_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$SMOKE_MONITOR_ENV_FILE"
  set +a
fi

set +e
SMOKE_LOG_RETENTION_DAYS="$SMOKE_LOG_RETENTION_DAYS" scripts/run-production-smoke-docker.sh "$@"
smoke_status="$?"
scripts/check-production-smoke-status.sh
check_status="$?"
set -e

if [ "$smoke_status" -ne 0 ]; then
  scripts/send-production-smoke-alert.sh "smoke-run-failed" || true
  exit "$smoke_status"
fi

if [ "$check_status" -ne 0 ]; then
  scripts/send-production-smoke-alert.sh "smoke-status-check-failed" || true
  exit "$check_status"
fi

echo "SMOKE_MONITOR ok"
