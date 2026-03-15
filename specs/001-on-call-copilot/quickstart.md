# Quickstart: On-Call Copilot

## Prerequisites
- Python 3.11+
- Gemini API Key
- Braintrust API Key

## Setup
1. **Initialize Environment**:
   ```bash
   uv sync
   ```

2. **Configure Environment Variables**:
   Copy `.env.template` to `.env` and add your API keys:
   ```bash
   cp .env.template .env
   # Edit .env with GEMINI_API_KEY, BRAINTRUST_API_KEY
   ```

3. **Run in Mock Mode** (No live LLM calls, if implemented):
   ```bash
   MOCK_MODE=true uv run uvicorn app.main:app --reload
   ```

## Test
Submit a test incident:
```bash
curl -X POST http://localhost:8000/invoke \
  -H "Content-Type: application/json" \
  -d @scripts/scenarios/sev1_checkout_latency.json
```
