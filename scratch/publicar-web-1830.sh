#!/usr/bin/env bash
# Publica la ficha web de tu-casa-50k en cuanto el vídeo es público (18:30 Madrid).
set -euo pipefail
cd /home/mvf/4sotas/site
mkdir -p out
while [ "$(date +%H%M)" -lt "1831" ]; do sleep 15; done
{
  echo "=== $(date -Is) publicar-ficha ==="
  node scripts/publicar-ficha.mjs --youtube-id mu4mTE_ouJ0 --commit
  echo "=== $(date -Is) fin ==="
} >> out/publicar-web-1830.log 2>&1
