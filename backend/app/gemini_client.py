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

# Initialize GenAI client pool
class GeminiClientPool:
    def __init__(self):
        self._clients = []
        self._current_index = 0
        self._initialized = False

    def _initialize(self):
        if self._initialized:
            return
            
        # Strategy 1: Comma-separated list in GEMINI_API_KEY
        raw_keys = os.environ.get("GEMINI_API_KEY", "")
        keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        
        # Strategy 2: Numbered env vars (GEMINI_API_KEY_1, GEMINI_API_KEY_2, ...)
        i = 1
        while True:
            key = os.environ.get(f"GEMINI_API_KEY_{i}")
            if not key:
                break
            if key not in keys:
                keys.append(key)
            i += 1
            
        if not keys:
            logger.warning("No GEMINI_API_KEY found in environment.")
        
        self._clients = [genai.Client(api_key=k) for k in keys]
        self._initialized = True
        logger.info("GeminiClientPool initialized with %d keys", len(self._clients))

    def get_client(self):
        self._initialize()
        if not self._clients:
            # Fallback for lazy initialization errors
            api_key = os.environ.get("GEMINI_API_KEY")
            return genai.Client(api_key=api_key)
            
        return self._clients[self._current_index]

    def rotate_key(self):
        """Move to the next API key in the pool."""
        if len(self._clients) <= 1:
            return False
            
        self._current_index = (self._current_index + 1) % len(self._clients)
        logger.info("Rotated to Gemini API key index %d", self._current_index)
        return True

_client_pool = GeminiClientPool()

def get_client():
    return _client_pool.get_client()

def rotate_api_key():
    return _client_pool.rotate_key()

class GeminiCallError(Exception):
    """Raised when Gemini fails after all retries."""
    pass

def preprocess_schema_for_gemini(schema: dict) -> dict:
    """
    Recursively converts standard JSON schema union types (e.g., {"type": ["string", "null"]})
    into a format that the Google GenAI SDK's response_schema parameter accepts
    (e.g., {"type": "string", "nullable": True}).
    """
    if not isinstance(schema, dict):
        return schema

    new_schema = schema.copy()

    # Handle the "type": ["something", "null"] case
    if "type" in new_schema and isinstance(new_schema["type"], list):
        types = new_schema["type"]
        if "null" in types:
            non_null_types = [t for t in types if t != "null"]
            if len(non_null_types) == 1:
                new_schema["type"] = non_null_types[0]
                new_schema["nullable"] = True
            elif len(non_null_types) == 0:
                new_schema["type"] = "null"
            # If multiple non-null types, we leave it (GenAI SDK might still complain, 
            # but we've handled the common nullable case)

    # Standardize types to uppercase if needed (though lowercase often works)
    # The SDK seems to prefer uppercase for the types in its internal enums
    if "type" in new_schema and isinstance(new_schema["type"], str):
        # Some SDK versions are picky about case
        if new_schema["type"].lower() in ["string", "number", "integer", "boolean", "array", "object", "null"]:
            new_schema["type"] = new_schema["type"].upper()

    # Recursively process properties
    if "properties" in new_schema:
        new_schema["properties"] = {
            k: preprocess_schema_for_gemini(v) for k, v in new_schema["properties"].items()
        }

    # Recursively process items in arrays
    if "items" in new_schema:
        new_schema["items"] = preprocess_schema_for_gemini(new_schema["items"])

    return new_schema

@retry(
    stop=stop_after_attempt(5), # More attempts for the whole fallback process if needed
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(GeminiCallError),
    reraise=True,
)
def generate_agent_response(
    instructions: str,
    incident_data: dict,
    output_schema: dict,
    model: str = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
) -> dict:
    """
    Call Gemini with JSON schema enforcement and model fallback.
    Fallback chain: gemini-3-flash-preview -> gemini-2.5-flash -> gemini-2.5-flash-lite
    """
    if os.getenv("MOCK_MODE", "false").lower() == "true" or not os.getenv("GEMINI_API_KEY"):
        from app.mock_data import get_mock_response
        logger.info("Using MOCK_MODE for agent response")
        return get_mock_response(output_schema)

    # Preprocess schema for Google GenAI SDK compatibility
    gemini_schema = preprocess_schema_for_gemini(output_schema)
    
    # Fallback chain configuration
    fallback_models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-flash-lite"]
    # If the user passed a custom model not in the list, put it first
    if model not in fallback_models:
        fallback_models.insert(0, model)
    else:
        # Start from the requested model if it's in our list
        idx = fallback_models.index(model)
        fallback_models = fallback_models[idx:]

    last_exception = None
    
    for current_model in fallback_models:
        # For each model, we try all available API keys before moving to the next model
        # This maximizes usage of the "best" models
        keys_to_try = max(1, len(_client_pool._clients)) if _client_pool._initialized else 1
        
        for key_attempt in range(keys_to_try):
            try:
                logger.info("Attempting agent response (model: %s, key_index: %d)", 
                            current_model, _client_pool._current_index)
                client = get_client()
                
                response = client.models.generate_content(
                    model=current_model,
                    contents=f"## Incident Data\n```json\n{json.dumps(incident_data, indent=2)}\n```\n\nFollow your system instructions. Return ONLY valid JSON matching the schema.",
                    config=types.GenerateContentConfig(
                        system_instruction=instructions,
                        response_mime_type="application/json",
                        response_schema=gemini_schema,
                        temperature=0.0,
                        max_output_tokens=4096,
                    ),
                )
                
                if not response.text:
                    raise GeminiCallError(f"Empty response from {current_model}")
                    
                return json.loads(response.text)

            except Exception as e:
                last_exception = e
                error_msg = str(e)
                logger.warning("Attempt failed (model: %s, key_index: %d): %s", 
                               current_model, _client_pool._current_index, error_msg)
                
                # If it's a quota issue, try rotating the key first
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    if rotate_api_key():
                        logger.info("Quota exceeded, rotated to next API key. Retrying same model...")
                        continue # Try same model with new key
                    else:
                        logger.info("Quota exceeded and no more keys to rotate. Falling back to next model...")
                        break # Move to next model
                
                # For other errors, we might want to try next key or next model
                # Let's try one more key just in case it's a transient account-specific issue,
                # otherwise move to next model.
                if rotate_api_key():
                    continue
                break

    raise GeminiCallError(f"All models in fallback chain failed. Last error: {last_exception}")

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
