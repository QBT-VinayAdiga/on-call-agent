# app/llm_client.py

import os
import json
import logging
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize OpenRouter client
openrouter_client = None
if os.environ.get("OPENROUTER_API_KEY"):
    openrouter_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        default_headers={
            "HTTP-Referer": "https://github.com/Adiga/on-call-agent",
            "X-Title": "On-Call Agent",
        }
    )

class LLMCallError(Exception):
    """Raised when all LLM attempts fail."""
    pass

class OpenRouterCallError(LLMCallError):
    """Raised when OpenRouter fails."""
    pass

def call_openrouter(
    instructions: str,
    incident_data: dict,
    output_schema: dict,
    model: str = os.getenv("OPENROUTER_MODEL", "openrouter/free"),
) -> dict:
    """Call OpenRouter."""
    if not openrouter_client:
        raise OpenRouterCallError("OpenRouter client not initialized (missing API key)")

    try:
        logger.info("Attempting agent response via OpenRouter (model: %s)", model)
        
        # We append the schema to instructions to ensure compliance
        prompt = f"{instructions}\n\nReturn ONLY valid JSON matching this schema:\n{json.dumps(output_schema, indent=2)}"
        
        response = openrouter_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"## Incident Data\n```json\n{json.dumps(incident_data, indent=2)}\n```"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )
        
        content = response.choices[0].message.content
        if not content:
            raise OpenRouterCallError("Empty response from OpenRouter")
            
        return json.loads(content)
    except Exception as e:
        logger.error("OpenRouter call failed: %s", str(e))
        raise OpenRouterCallError(f"OpenRouter failed: {str(e)}")

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(LLMCallError),
    reraise=True,
)
def generate_agent_response(
    instructions: str,
    incident_data: dict,
    output_schema: dict,
    model: str = None,
    provider: str = "openrouter"
) -> dict:
    """
    Call an LLM with provider selection (defaulting to openrouter).
    """
    if os.getenv("MOCK_MODE", "false").lower() == "true":
        from app.mock_data import get_mock_response
        logger.info("Using MOCK_MODE for agent response")
        return get_mock_response(output_schema)

    # Provider is always openrouter now
    return call_openrouter(instructions, incident_data, output_schema)

def structure_incident_data(raw_text: str, provider: str = "openrouter") -> dict:
    """Uses LLM to convert raw unstructured text into the INCIDENT_INPUT_SCHEMA."""
    from app.schemas import INCIDENT_INPUT_SCHEMA
    
    instructions = """
    You are an incident data parser. Convert the following raw text (logs, alerts, metrics) 
    into a structured JSON object matching the provided schema. 
    If data is missing (like incident_id), generate a plausible unique ID.
    Ensure 'timeframe.start' is in ISO 8601 format.
    """
    
    return generate_agent_response(
        instructions=instructions,
        incident_data={"raw_input": raw_text},
        output_schema=INCIDENT_INPUT_SCHEMA,
        provider=provider
    )
