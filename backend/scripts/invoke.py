# scripts/invoke.py

import sys
import json
import httpx
import argparse
import os
from dotenv import load_dotenv

load_dotenv()

def invoke_incident(file_path: str, url: str):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        return

    with open(file_path, "r") as f:
        incident = json.load(f)

    print(f"Invoking {url} with {file_path}...")
    
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, json=incident)
            response.raise_for_status()
            print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Invoke On-Call Copilot with an incident JSON")
    parser.add_argument("file", help="Path to incident JSON file")
    parser.add_argument("--url", default="http://localhost:8000/invoke", help="API URL")
    
    args = parser.parse_args()
    invoke_incident(args.file, args.url)
