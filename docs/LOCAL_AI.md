# Local AI Development Guide

PABOS Enterprise uses a local Large Language Model (LLM) for AI-assisted intake and workflow guidance. Keeping the model on-premise helps protect client PII and aligns with POPIA data minimisation principles.

The local LLM runs inside Docker via [Ollama](https://ollama.com/). This guide covers starting Ollama, downloading a model, and testing the AI intake endpoint.

---

## 1. Start the infrastructure

From the project root, start only the infrastructure services (or all of them):

```bash
docker compose -f infra/docker-compose.dev.yml up -d ollama
```

To start all infrastructure services at once:

```bash
npm run infra:up
```

Ollama exposes its API on `http://localhost:11434` by default.

---

## 2. Pull a model

The recommended dev model is **Llama 3.2** — small enough to run on CPU while still useful for intake classification and drafting.

### Option A — helper script

```bash
npm run ollama:pull
```

Or run the script directly:

```bash
bash infra/ollama/pull-model.sh
```

On Windows PowerShell:

```powershell
infra/ollama/pull-model.ps1
```

### Option B — manual Docker command

```bash
docker exec -it pabos-ollama ollama pull llama3.2
```

The first download may take several minutes depending on your internet connection. The model is persisted in the `pabos_ollama_models` Docker volume, so it survives container restarts.

---

## 3. Verify the model is available

```bash
curl http://localhost:11434/api/tags
```

You should see `llama3.2` (or your chosen model) in the list.

---

## 4. Test the intake endpoint

Once the backend is running and Ollama is available, test the AI intake endpoint:

```bash
curl -X POST http://localhost:4000/ai/intake \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I would like to add a second vehicle to my motor policy.",
    "context": { "lineOfBusiness": "personal_motor" }
  }'
```

A successful response includes:

- `summary` — short summary of the enquiry
- `activityCode` — suggested standard activity code
- `priority` — suggested priority
- `missingInfo` — list of missing information still required
- `tasks` — suggested follow-up tasks
- `draftResponse` — optional draft acknowledgement
- `complianceFlags` — any FAIS/FICA/POPIA/TCF considerations

> **Important:** AI outputs are advisory only. A human user must review and approve any client-facing action.

---

## 5. CPU vs GPU mode

### CPU mode (default)

The `infra/docker-compose.dev.yml` file runs Ollama in CPU mode. This works on any machine with enough RAM (at least 8 GB system RAM; 16 GB recommended).

### GPU mode (optional)

If your development machine has an NVIDIA GPU and the NVIDIA Container Toolkit installed, uncomment or add the following to the `ollama` service in `infra/docker-compose.dev.yml`:

```yaml
ollama:
  image: ollama/ollama:latest
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

GPU mode significantly improves response time for larger models. For the pilot deployment on a single workstation, GPU mode is recommended if hardware supports it.

---

## 6. Switching models

To use a different model, update the `OLLAMA_MODEL` environment variable in your `.env` file and restart the backend. Make sure the model has already been pulled into Ollama.

Example alternatives for development:

- `llama3.2` — default, fast, good for classification
- `mistral` — stronger reasoning, larger download
- `phi3` — lightweight Microsoft model

---

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| `connection refused` | Is Ollama running? `docker ps` should show `pabos-ollama`. |
| Model not found | Run `docker exec -it pabos-ollama ollama pull llama3.2`. |
| Very slow responses | You are likely in CPU mode. Close other applications or enable GPU mode. |
| Out of memory | Use a smaller model (e.g. `phi3`) or increase Docker memory limits. |

---

## 8. Security note

Local models keep raw client data inside the Praeto environment. Even so, apply the standard PII handling rules:

- Mask or tokenise PII before sending text to any external service.
- Log only tokenised or redacted input.
- Ensure AI output is reviewed by an authorised user before any client-facing action.
