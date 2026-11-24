#!/usr/bin/env bash
# Publica la ficha web de «clase media» cuando el vídeo de YouTube deja de estar privado.
# Idempotente: se puede relanzar a mano sin duplicar nada.
set -euo pipefail
cd /home/hermesiarco/Escritorio/Proyectos/4sotas
export PATH="/home/hermesiarco/.local/node24/bin:/home/hermesiarco/venvs/yt-manager/bin:$PATH"
set -a; . /home/hermesiarco/.hermes/secrets/cloudflare.env; set +a
export CLOUDFLARE_ACCOUNT_ID=7cc5b8908a55337b3541ca4f69977b23

ID=yNzk0Yr7504
SLUG=clase-media-espana
FICHA="src/content/videos/vid-${ID}.yaml"
LOG="out/publicacion-${ID}.log"
mkdir -p out
exec >>"$LOG" 2>&1
echo "[$(date -Is)] inicio"

esperar_publico() {
  local i
  for i in $(seq 1 30); do
    if ~/venvs/yt-manager/bin/python \
      ~/.hermes/profiles/orchestrator/scripts/yt_verify.py "$ID" 2>/dev/null \
      | grep -q '^privacy: public'; then
      echo "[$(date -Is)] YouTube ya lo sirve público"
      return 0
    fi
    sleep 60
  done
  return 1
}

if ! esperar_publico; then
  echo "[$(date -Is)] ERROR: sigue privado tras 30 min; no se toca la ficha"
  exit 1
fi

sed -i \
  -e 's/^status: revision$/status: publicado/' \
  -e 's/^estado_youtube: .*/estado_youtube: publico/' \
  -e 's/^privacidad_api: .*/privacidad_api: public/' \
  -e "s/^verificado_en: .*/verificado_en: $(date +%F)/" \
  "$FICHA"

npm run build
npx wrangler pages deploy dist --project-name=4sotas --branch=main --commit-dirty=true

TOKEN=$(grep -h '^TELEGRAM_BOT_TOKEN=' /home/hermesiarco/.hermes/profiles/orchestrator/.env /home/hermesiarco/.hermes/.env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
CHAT=$(grep -h '^TELEGRAM_HOME_CHANNEL=' /home/hermesiarco/.hermes/.env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
if [ -n "${TOKEN:-}" ] && [ -n "${CHAT:-}" ]; then
  curl -4 -s -m 30 -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    --data-urlencode "chat_id=$CHAT" \
    --data-urlencode "text=Ya está publicado «¿Está desapareciendo la clase media en España?» · https://www.youtube.com/watch?v=${ID} · Ficha: https://4sotas.com/oros/videos/${SLUG}/" \
    >/dev/null || true
fi
echo "[$(date -Is)] fin"
