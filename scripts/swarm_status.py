import json
import time
import os
from pathlib import Path

# Color codes
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def check_status():
    report_path = Path(".Agentica/logs/swarm/report.json")
    if not report_path.exists():
        print("No swarm report found. Is the dispatcher running?")
        return

    try:
        with open(report_path, 'r') as f:
            report = json.load(f)

        print(f"\n{BLUE}=== Swarm Status ({report['timestamp']}) ==={RESET}")
        for task in report['tasks']:
            print(f"- {task['id']} ({task['agent']}): {task['status']} | Duration: {task['duration']}")
    except Exception as e:
        print(f"Error reading report: {e}")

if __name__ == "__main__":
    check_status()
