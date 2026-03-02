import http.server
import socketserver
import json
import os
from pathlib import Path

# Agentica Control Center API (P7)
PORT = 8080

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            # Aggregate status
            status = {
                "project": "Agent Americana",
                "version": "3.0.0 (Evolution)",
                "heartbeat": self.get_latest_heartbeat(),
                "swarm": self.get_latest_swarm(),
                "registry": self.get_registry_count(),
                "vector_memory": self.get_vector_count()
            }
            self.wfile.write(json.dumps(status).encode())
        else:
            super().do_GET()

    def get_latest_heartbeat(self):
        path = Path(".Agentica/logs/heartbeat.log")
        return "Active" if path.exists() else "Inactive"

    def get_latest_swarm(self):
        path = Path(".Agentica/logs/swarm/report.json")
        if path.exists():
            with open(path, 'r') as f:
                return json.load(f)
        return None

    def get_registry_count(self):
        path = Path(".Agentica/registry.json")
        if path.exists():
            with open(path, 'r') as f:
                return len(json.load(f).get("installed", {}))
        return 0

    def get_vector_count(self):
        path = Path(".Agentica/vector_store.json")
        if path.exists():
            with open(path, 'r') as f:
                return len(json.load(f).get("documents", []))
        return 0

if __name__ == "__main__":
    print(f"[*] Starting Agentica Control Center API on port {PORT}...")
    with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
        httpd.serve_forever()
