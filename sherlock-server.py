#!/usr/bin/env python3
"""
Sherlock local API server
─────────────────────────
Run this on your Kali machine, then open Sherlock.html in your browser.

Requirements:
  - sherlock-project installed  →  pip install sherlock-project
    OR  apt install sherlock    (Kali repos)
  - Python 3.7+  (stdlib only — no extra pip installs needed for this script)

Usage:
  python3 sherlock-server.py

Then open Sherlock.html (file:// or any local server).
"""

import http.server
import json
import re
import subprocess
import sys

PORT = 7474

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# Regex: only allow safe username characters
USERNAME_RE = re.compile(r'^[a-zA-Z0-9._\-]{1,64}$')


class SherlockHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # Custom logging with colour
        print(f"\033[36m[REQ]\033[0m {self.address_string()} — {fmt % args}")

    def _cors(self):
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/run":
            self.send_error(404, "Not Found")
            return

        # ── parse body ──────────────────────────────────────────────────────
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            self.send_error(400, "Empty body")
            return
        try:
            body = json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        username = body.get("username", "").strip()

        # ── validate username ───────────────────────────────────────────────
        if not USERNAME_RE.match(username):
            self.send_response(400)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({"error": "Invalid username. Use letters, numbers, dots, hyphens, underscores (max 64 chars)."}).encode()
            )
            return

        print(f"\033[32m[RUN]\033[0m sherlock {username}")

        # ── SSE response headers ────────────────────────────────────────────
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type",  "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-store")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()

        def emit(payload: dict):
            try:
                self.wfile.write(f"data: {json.dumps(payload)}\n\n".encode())
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass

        # ── run sherlock ────────────────────────────────────────────────────
        try:
            proc = subprocess.Popen(
                ["sherlock", username, "--print-found", "--timeout", "10"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            for raw_line in proc.stdout:
                line = raw_line.rstrip()
                if not line:
                    continue
                emit({"line": line})

            proc.wait()
            emit({"done": True, "returncode": proc.returncode})

        except FileNotFoundError:
            emit({"error": "sherlock not found. Install with:  pip install sherlock-project"})
            emit({"done": True, "returncode": 1})
        except BrokenPipeError:
            pass
        except Exception as exc:
            emit({"error": str(exc)})
            emit({"done": True, "returncode": 1})


if __name__ == "__main__":
    server_class = http.server.ThreadingHTTPServer
    try:
        httpd = server_class(("127.0.0.1", PORT), SherlockHandler)
    except OSError as e:
        print(f"\033[31m[ERR]\033[0m Cannot bind to port {PORT}: {e}")
        sys.exit(1)

    print(f"\033[36m")
    print(r"  ____  _               _            _    ")
    print(r" / ___|| |__   ___ _ __| | ___   ___| | __")
    print(r" \___ \| '_ \ / _ \ '__| |/ _ \ / __| |/ /")
    print(r"  ___) | | | |  __/ |  | | (_) | (__|   < ")
    print(r" |____/|_| |_|\___|_|  |_|\___/ \___|_|\_\\")
    print(f"\033[0m")
    print(f"\033[32m[*]\033[0m Server listening on \033[36mhttp://127.0.0.1:{PORT}\033[0m")
    print(f"\033[32m[*]\033[0m Open \033[33mSherlock.html\033[0m in your browser")
    print(f"\033[32m[*]\033[0m Ctrl+C to stop\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\033[33m[*]\033[0m Server stopped.")
        httpd.server_close()
