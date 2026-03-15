# app/gemini_client.py

import os
import json
import logging
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize GenAI client lazily
_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            # If no key and not in mock mode, this will eventually raise an error when called
            # but allows module loading to succeed.
            logger.warning("GEMINI_API_KEY is not set.")
        _client = genai.Client(api_key=api_key)
    return _client

class GeminiCallError(Exception):
    """Raised when Gemini fails after all retries."""
    pass

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def generate_agent_response(
    instructions: str,
    incident_data: dict,
    output_schema: dict,
    model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
) -> dict:
    """
    Call Gemini with JSON schema enforcement.
    Retries up to 3 times with exponential backoff.
    """
    if os.getenv("MOCK_MODE", "false").lower() == "true" or not os.getenv("GEMINI_API_KEY"):
        from app.mock_data import get_mock_response
        logger.info("Using MOCK_MODE for agent response")
        return get_mock_response(output_schema)

    prompt = f"""## Incident Data
```json
{json.dumps(incident_data, indent=2)}
```

Follow your system instructions. Return ONLY valid JSON matching the schema."""

    try:
        client = get_client()
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=instructions,
                response_mime_type="application/json",
                response_schema=output_schema,
                temperature=0.0,          # Deterministic output
                max_output_tokens=4096,
            ),
        )
        
        if not response.text:
            raise GeminiCallError("Empty response from Gemini")
            
        return json.loads(response.text)

    except Exception as e:
        logger.error("Gemini call failed: %s", str(e))
        raise GeminiCallError(f"Gemini call failed: {e}") from e

def structure_incident_data(raw_text: str) -> dict:
    """Uses Gemini to convert raw unstructured text into the INCIDENT_INPUT_SCHEMA."""
    from app.schemas import INCIDENT_INPUT_SCHEMA
    
    instructions = """
    You are an incident data parser. Convert the following raw text (logs, alerts, metrics) 
    into a structured JSON object matching the provided schema. 
    If data is missing (like incident_id), generate a plausible unique ID.
    Ensure 'timeframe.start' is in ISO 8601 format.
    """
    
    # We reuse the generate_agent_response logic but with different instructions
    return generate_agent_response(
        instructions=instructions,
        incident_data={"raw_input": raw_text},
        output_schema=INCIDENT_INPUT_SCHEMA
    )
