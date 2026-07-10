#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/root/token_API}"
CRON_SCHEDULE="${CRON_SCHEDULE:-17 */6 * * *}"
CRON_USER="${CRON_USER:-$(id -un)}"
SMOKE_LOG_RETENTION_DAYS="${SMOKE_LOG_RETENTION_DAYS:-14}"
SMOKE_MONITOR_ENV_FILE="${SMOKE_MONITOR_ENV_FILE:-$PROJECT_DIR/config/production-smoke-monitor.env}"
MARK_BEGIN="# BEGIN MatrixAPI production smoke"
MARK_END="# END MatrixAPI production smoke"
CRON_COMMAND="cd $PROJECT_DIR && SMOKE_MONITOR_ENV_FILE=$SMOKE_MONITOR_ENV_FILE SMOKE_LOG_RETENTION_DAYS=$SMOKE_LOG_RETENTION_DAYS scripts/run-production-smoke-monitor.sh >/dev/null 2>&1"

usage() {
  cat <<'USAGE'
MatrixAPI production smoke cron manager

Usage:
  scripts/install-production-smoke-cron.sh install
  scripts/install-production-smoke-cron.sh status
  scripts/install-production-smoke-cron.sh remove
  scripts/install-production-smoke-cron.sh run-once

Environment:
  PROJECT_DIR=/root/token_API
  CRON_SCHEDULE="17 */6 * * *"
  SMOKE_MONITOR_ENV_FILE=/root/token_API/config/production-smoke-monitor.env
  SMOKE_LOG_RETENTION_DAYS=14
  SMOKE_ALERT_WEBHOOK_URL=https://example.com/webhook
USAGE
}

require_crontab() {
  if ! command -v crontab >/dev/null 2>&1; then
    echo "crontab is not installed on this server." >&2
    exit 1
  fi
}

current_cron() {
  crontab -l 2>/dev/null || true
}

without_matrix_block() {
  awk -v begin="$MARK_BEGIN" -v end="$MARK_END" '
    $0 == begin { skip = 1; next }
    $0 == end { skip = 0; next }
    skip != 1 { print }
  '
}

install_cron() {
  require_crontab
  if [ ! -x "$PROJECT_DIR/scripts/run-production-smoke-monitor.sh" ]; then
    echo "Smoke monitor is missing or not executable: $PROJECT_DIR/scripts/run-production-smoke-monitor.sh" >&2
    exit 1
  fi

  tmp_file="$(mktemp)"
  trap 'rm -f "$tmp_file"' EXIT
  current_cron | without_matrix_block > "$tmp_file"
  {
    printf '%s\n' "$MARK_BEGIN"
    printf '%s %s\n' "$CRON_SCHEDULE" "$CRON_COMMAND"
    printf '%s\n' "$MARK_END"
  } >> "$tmp_file"
  crontab "$tmp_file"
  echo "Installed MatrixAPI production smoke cron for $CRON_USER:"
  printf '%s %s\n' "$CRON_SCHEDULE" "$CRON_COMMAND"
}

remove_cron() {
  require_crontab
  tmp_file="$(mktemp)"
  trap 'rm -f "$tmp_file"' EXIT
  current_cron | without_matrix_block > "$tmp_file"
  crontab "$tmp_file"
  echo "Removed MatrixAPI production smoke cron for $CRON_USER."
}

status_cron() {
  require_crontab
  echo "Current MatrixAPI production smoke cron block:"
  current_cron | awk -v begin="$MARK_BEGIN" -v end="$MARK_END" '
    $0 == begin { show = 1 }
    show == 1 { print }
    $0 == end { show = 0 }
  '
}

run_once() {
  cd "$PROJECT_DIR"
  SMOKE_MONITOR_ENV_FILE="$SMOKE_MONITOR_ENV_FILE" SMOKE_LOG_RETENTION_DAYS="$SMOKE_LOG_RETENTION_DAYS" scripts/run-production-smoke-monitor.sh
}

case "${1:-}" in
  install)
    install_cron
    ;;
  remove)
    remove_cron
    ;;
  status)
    status_cron
    ;;
  run-once)
    run_once
    ;;
  --help|-h|help|'')
    usage
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage >&2
    exit 1
    ;;
esac
