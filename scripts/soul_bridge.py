import shutil
import json
import os
from pathlib import Path

# Agentica P10: The Multi-Project Registry Bridge
# Syncs reasoning and soul memory across an entire workspace or projects list.

class SoulBridge:
    def __init__(self, bridge_config=".Agentica/bridge.json"):
        self.config_path = Path(bridge_config)
        self.projects = self.load_projects()

    def load_projects(self):
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return json.load(f).get("projects", [])
        return []

    def add_project(self, path):
        path = str(Path(path).resolve())
        if path not in self.projects:
            self.projects.append(path)
            self.save_projects()
            print(f"[+] Added project to bridge: {path}")

    def save_projects(self):
        with open(self.config_path, 'w') as f:
            json.dump({"projects": self.projects}, f, indent=2)

    def sync_all(self):
        print(f"[*] Soul Bridge: Syncing {len(self.projects)} projects...")

        # 1. Collect all decisions from all projects
        all_decisions = []
        for project_path in self.projects:
            bank_path = Path(project_path) / "memory" / "reasoning-bank" / "decisions.json"
            if bank_path.exists():
                with open(bank_path, 'r') as f:
                    data = json.load(f)
                    all_decisions.extend(data.get("decisions", []))

        # 2. Deduplicate by task (naively)
        unique_decisions = { d["task"]: d for d in all_decisions }.values()

        # 3. Push consolidated bank back to all projects
        consolidated = { "decisions": list(unique_decisions) }

        for project_path in self.projects:
            dest_path = Path(project_path) / "memory" / "reasoning-bank" / "decisions.json"
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            with open(dest_path, 'w') as f:
                json.dump(consolidated, f, indent=2)

        print(f"[+] Soul Bridge: Consolidated {len(unique_decisions)} decisions across all projects.")

if __name__ == "__main__":
    import sys
    bridge = SoulBridge()
    if len(sys.argv) < 2:
        print("Usage: python soul_bridge.py <command> [args]")
        print("  Commands: add <path>, sync")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "add":
        bridge.add_project(sys.argv[2])
    elif cmd == "sync":
        bridge.sync_all()
