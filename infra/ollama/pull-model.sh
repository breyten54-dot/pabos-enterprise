#!/usr/bin/env bash
# Pull the default development model into the PABOS Ollama container.

set -e

MODEL="${1:-llama3.2}"
CONTAINER_NAME="${OLLAMA_CONTAINER:-pabos-ollama}"

echo "[PABOS] Pulling model '${MODEL}' into container '${CONTAINER_NAME}'..."

if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "[PABOS] Container '${CONTAINER_NAME}' is not running."
  echo "[PABOS] Start it with: docker compose -f infra/docker-compose.dev.yml up -d ollama"
  exit 1
fi

docker exec -it "${CONTAINER_NAME}" ollama pull "${MODEL}"

echo "[PABOS] Model '${MODEL}' is ready."
echo "[PABOS] Verify with: curl http://localhost:11434/api/tags"
