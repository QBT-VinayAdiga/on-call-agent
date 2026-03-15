# scripts/run_scenarios.py

import os
import json
import httpx
import asyncio
import time
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("API_URL", "http://localhost:8000/invoke")
SCENARIOS_DIR = "on-call-agent/specs/001-on-call-copilot/scenarios" # or scripts/scenarios

async def run_scenario(client, file_path):
    with open(file_path, "r") as f:
        incident = json.load(f)
    
    start = time.monotonic()
    try:
        response = await client.post(URL, json=incident)
        latency = (time.monotonic() - start) * 1000
        status = "PASS" if response.status_code == 200 else f"FAIL ({response.status_code})"
        return {
            "scenario": os.path.basename(file_path),
            "status": status,
            "latency_ms": latency,
            "error": response.text if response.status_code != 200 else None
        }
    except Exception as e:
        return {
            "scenario": os.path.basename(file_path),
            "status": f"ERROR: {str(e)}",
            "latency_ms": (time.monotonic() - start) * 1000
        }

async def main():
    # Use scripts/scenarios if it exists, else use the ones in specs
    scenarios_dir = "scripts/scenarios"
    if not os.path.exists(scenarios_dir):
        scenarios_dir = "on-call-agent/specs/001-on-call-copilot/scenarios"
        if not os.path.exists(scenarios_dir):
            print("No scenarios directory found.")
            return

    files = [os.path.join(scenarios_dir, f) for f in os.listdir(scenarios_dir) if f.endswith(".json")]
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        tasks = [run_scenario(client, f) for f in files]
        results = await asyncio.gather(*tasks)
    
    print(f"{'Scenario':<30} | {'Status':<10} | {'Latency (ms)':<15}")
    print("-" * 60)
    for r in results:
        print(f"{r['scenario']:<30} | {r['status']:<10} | {r['latency_ms']:<15.2f}")

if __name__ == "__main__":
    asyncio.run(main())
