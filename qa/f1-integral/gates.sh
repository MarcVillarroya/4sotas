#!/usr/bin/env bash
# QA integral F1: cadena de gates reproducible desde el candidato.
set -u
cd "$(dirname "$0")/../.." || exit 1
LOG=qa/f1-integral/01-gates.log
: > "$LOG"
run() {
  local name="$1"; shift
  echo "=== $name: $*" | tee -a "$LOG"
  "$@" > "/tmp/qa-$name.out" 2>&1
  local rc=$?
  echo "exit=$rc" | tee -a "$LOG"
  tail -n 14 "/tmp/qa-$name.out" | tee -a "$LOG"
  echo "" | tee -a "$LOG"
  return 0
}
echo "node $(node -v) npm $(npm -v)" | tee -a "$LOG"
echo "HEAD $(git rev-parse HEAD) branch $(git rev-parse --abbrev-ref HEAD)" | tee -a "$LOG"
rm -rf dist dist-fixtures .astro
run check npm run check
run test npm test
run build npm run build
run validate npm run validate
run buildfixtures npm run build:fixtures
run plantillas npm run verificar:plantillas
echo "=== done" | tee -a "$LOG"
