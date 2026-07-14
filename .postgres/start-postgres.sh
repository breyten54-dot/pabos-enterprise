#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/pgsql/bin/pg_ctl" -D "$SCRIPT_DIR/data" -l "$SCRIPT_DIR/postgres.log" start
