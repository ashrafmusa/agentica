import json
import subprocess
import threading
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Color codes for terminal output
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

class SwarmTask:
    def __init__(self, id, agent, command, description=""):
        self.id = id
        self.agent = agent
        self.command = command
        self.description = description
        self.status = "PENDING"
        self.output = ""
        self.start_time = None
        self.end_time = None

class SwarmDispatcher:
    def __init__(self, manifest_path):
        self.manifest_path = Path(manifest_path)
        self.tasks = []
        self.logs_dir = Path(".Agentica/logs/swarm")
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.load_manifest()

    def load_manifest(self):
        try:
            with open(self.manifest_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for task_data in data.get("tasks", []):
                    task = SwarmTask(
                        task_data.get("id"),
                        task_data.get("agent"),
                        task_data.get("command"),
                        task_data.get("description", "")
                    )
                    self.tasks.append(task)
        except Exception as e:
            print(f"{RED}[-] Failed to load manifest: {e}{RESET}")
            sys.exit(1)

    def run_task(self, task):
        task.status = "RUNNING"
        task.start_time = datetime.now()
        print(f"{BLUE}[*] Swarm Dispatch -> Agent: {task.agent} | Task: {task.id}{RESET}")

        log_file = self.logs_dir / f"{task.id}.log"

        try:
            # Execute command in background
            process = subprocess.Popen(
                task.command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace'
            )

            with open(log_file, 'w', encoding='utf-8') as f:
                f.write(f"--- SWARM TASK: {task.id} ---\n")
                f.write(f"Agent: {task.agent}\n")
                f.write(f"Started: {task.start_time}\n")
                f.write(f"Command: {task.command}\n\n")

                for line in process.stdout:
                    f.write(line)
                    f.flush()

            process.wait()
            task.end_time = datetime.now()

            if process.returncode == 0:
                task.status = "COMPLETED"
                print(f"{GREEN}[+] Agent: {task.agent} | Task: {task.id} finished successfully.{RESET}")
            else:
                task.status = "FAILED"
                print(f"{RED}[-] Agent: {task.agent} | Task: {task.id} failed with exit code {process.returncode}.{RESET}")

        except Exception as e:
            task.status = "ERROR"
            print(f"{RED}[!] Error executing task {task.id}: {e}{RESET}")

    def dispatch(self, parallel=True):
        print(f"{YELLOW}[!] INITIALIZING SWARM DISPATCHER (Parallel={parallel}){RESET}")
        threads = []

        for task in self.tasks:
            if parallel:
                t = threading.Thread(target=self.run_task, args=(task,))
                t.start()
                threads.append(t)
            else:
                self.run_task(task)

        if parallel:
            for t in threads:
                t.join()

        self.generate_report()

    def generate_report(self):
        report_path = self.logs_dir / "report.json"
        report = {
            "timestamp": datetime.now().isoformat(),
            "tasks": [
                {
                    "id": t.id,
                    "agent": t.agent,
                    "status": t.status,
                    "duration": str(t.end_time - t.start_time) if t.end_time and t.start_time else "N/A"
                } for t in self.tasks
            ]
        }

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        print(f"\n{YELLOW}--- SWARM DISPATCH REPORT ---{RESET}")
        for t in self.tasks:
            status_color = GREEN if t.status == "COMPLETED" else RED if t.status in ["FAILED", "ERROR"] else BLUE
            print(f"[{status_color}{t.status}{RESET}] {t.id} ({t.agent})")
        print(f"{YELLOW}-----------------------------{RESET}")
        print(f"Summary saved to: {report_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python swarm_dispatcher.py manifest.json [--sequential]")
        sys.exit(1)

    parallel_mode = "--sequential" not in sys.argv
    dispatcher = SwarmDispatcher(sys.argv[1])
    dispatcher.dispatch(parallel=parallel_mode)
