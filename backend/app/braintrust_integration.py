# app/braintrust_integration.py

import os
import braintrust
import functools
import time
from app.telemetry import logger
from app.llm_client import generate_agent_response
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Braintrust
if os.environ.get("BRAINTRUST_API_KEY"):
    braintrust.init_logger(
        project=os.environ.get("BRAINTRUST_PROJECT", "on-call-agent"),
        org_name=os.environ.get("BRAINTRUST_ORG", "Adiga"),
        api_key=os.environ["BRAINTRUST_API_KEY"],
    )

def trace_agent_node(name: str, output_key: str):
    """
    Decorator to wrap LangGraph agent nodes with Braintrust tracing, 
    latency metrics, and automated error handling.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(state: "AgentState", *args, **kwargs):
            incident = state.get("incident", {})
            correlation_id = state.get("correlation_id")
            
            with braintrust.start_span(
                name=name, 
                input={
                    "incident_id": incident.get("incident_id"), 
                    "correlation_id": correlation_id
                }
            ) as span:
                start = time.monotonic()
                try:
                    # Execute the node function (which should return the LLM response)
                    result = func(state, *args, **kwargs)
                    
                    latency_ms = (time.monotonic() - start) * 1000
                    
                    # Log to Braintrust
                    span.log(
                        output=result, 
                        metrics={"latency_ms": latency_ms},
                        metadata={"correlation_id": correlation_id}
                    )
                    
                    # Structured logging
                    logger.info(f"agent_node_success", extra={
                        "node": name,
                        "latency_ms": latency_ms,
                        "correlation_id": correlation_id
                    })
                    
                    return {output_key: result}
                    
                except Exception as e:
                    latency_ms = (time.monotonic() - start) * 1000
                    span.log(
                        output={"_error": str(e)}, 
                        metrics={"latency_ms": latency_ms},
                        status="error",
                        metadata={"correlation_id": correlation_id}
                    )
                    logger.error(f"agent_node_failed", extra={
                        "node": name,
                        "error": str(e),
                        "correlation_id": correlation_id
                    })
                    # Return partial state update with error
                    return {
                        output_key: {},
                        "agent_errors": {name.split("-")[0]: str(e)}
                    }
        return wrapper
    return decorator
