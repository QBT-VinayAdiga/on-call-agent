# app/telemetry.py

import re
import uuid
import structlog
import logging
from typing import Any

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()

# Common secret patterns
SECRET_PATTERNS = [
    r'(?i)(api[_-]?key|token|secret|password|passwd|credential)["\s:=]+["\']?([A-Za-z0-9+/=_\-\.]{8,})["\']?',
    r'AKIA[0-9A-Z]{16}',                           # AWS access key IDs
    r'"private_key":\s*"-----BEGIN[^"]*"',          # GCP service account keys
    r'Bearer\s+[A-Za-z0-9\-_\.]+',                 # Bearer tokens
    r'(?i)(mongodb|postgres|mysql|redis):\/\/[^\s"\']+',  # Connection strings
]

def redact_secrets(payload: Any, depth: int = 0) -> Any:
    """Recursively redact secrets from incident payload."""
    if depth > 10:
        return payload

    if isinstance(payload, str):
        result = payload
        for pattern in SECRET_PATTERNS:
            # Redact by replacing sensitive part with [REDACTED]
            result = re.sub(pattern, lambda m: m.group(0)[:4] + "[REDACTED]", result)
        return result

    if isinstance(payload, dict):
        return {k: redact_secrets(v, depth + 1) for k, v in payload.items()}

    if isinstance(payload, list):
        return [redact_secrets(item, depth + 1) for item in payload]

    return payload

def get_correlation_id() -> str:
    return str(uuid.uuid4())
