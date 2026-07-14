# Pull the default development model into the PABOS Ollama container.

param(
    [string]$Model = "llama3.2",
    [string]$ContainerName = "pabos-ollama"
)

Write-Host "[PABOS] Pulling model '${Model}' into container '${ContainerName}'..."

$running = docker ps --format "{{.Names}}" | Select-String -Pattern "^${ContainerName}$"

if (-not $running) {
    Write-Host "[PABOS] Container '${ContainerName}' is not running."
    Write-Host "[PABOS] Start it with: docker compose -f infra/docker-compose.dev.yml up -d ollama"
    exit 1
}

docker exec -it "${ContainerName}" ollama pull "${Model}"

Write-Host "[PABOS] Model '${Model}' is ready."
Write-Host "[PABOS] Verify with: curl http://localhost:11434/api/tags"
