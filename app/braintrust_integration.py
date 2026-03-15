# app/braintrust_integration.py

import os
import braintrust
from app.gemini_client import generate_agent_response
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Braintrust
if os.environ.get("BRAINTRUST_API_KEY"):
    braintrust.init(
        project=os.environ.get("BRAINTRUST_PROJECT", "on-call-agent"),
        org_name=os.environ.get("BRAINTRUST_ORG", "Adiga"),
        api_key=os.environ["BRAINTRUST_API_KEY"],
    )

def traced_agent_call(
    agent_name: str,
    instructions: str,
    incident_data: dict,
    output_schema: dict,
    correlation_id: str,
) -> dict:
    """
    Wrap the agent call in a Braintrust span for tracing.
    """
    with braintrust.start_span(
        name=agent_name,
        input={
            "incident_id": incident_data.get("incident_id"),
            "severity": incident_data.get("severity"),
            "correlation_id": correlation_id,
        }
    ) as span:
        try:
            result = generate_agent_response(
                instructions=instructions,
                incident_data=incident_data,
                output_schema=output_schema,
            )
            span.log(
                output=result,
                metadata={"correlation_id": correlation_id},
            )
            return result
        except Exception as e:
            span.log(
                output={"_error": str(e)},
                metadata={"correlation_id": correlation_id},
                status="error"
            )
            raise e
