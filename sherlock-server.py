#!/usr/bin/env python3
"""
Sherlock local API server  (HTTPS)
────────────────────────────────────
Run this on your Kali machine, then visit the GitHub Pages Sherlock.html.

Because Sherlock.html is served over HTTPS (GitHub Pages), browsers block
plain-HTTP requests to localhost (mixed content policy).  This server
auto-generates a self-signed TLS certificate so it speaks HTTPS on
127.0.0.1:7474 — matching the security context of the page.

ONE-TIME BROWSER TRUST STEP (per browser / per new cert):
  1. Start this server.
  2. Visit  https://127.0.0.1:7474/  in the same browser you use for
     Sherlock.html.  You will see a certificate warning.
  3. Click Advanced → Proceed (Chrome) or Accept the Risk (Firefox).
  4. You should see  {"status":"ok"}  — the browser now trusts the cert.
  5. Open / reload Sherlock.html — the HUNT button will work.

Requirements:
  - sherlock-project  →  pip install sherlock-project
    OR                    sudo apt install sherlock
  - openssl binary available (standard on Kali)
  - Python 3.7+  (stdlib only for the server itself)

Usage:
  python3 sherlock-server.py
"""

import http.server
import json
import os
import re
import ssl
import subprocess
import sys
import tempfile

PORT    = 7474
HOST    = "127.0.0.1"
CERT    = "sherlock-cert.pem"
KEY     = "sherlock-key.pem"

CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

USERNAME_RE = re.compile(r'^[a-zA-Z0-9._\-]{1,64}$')


# ── TLS cert generation ────────────────────────────────────────────────────────

def generate_cert():
    """Generate a self-signed cert/key pair using the openssl CLI."""
    if os.path.exists(CERT) and os.path.exists(KEY):
        print(f"\033[33m[TLS]\033[0m Reusing existing cert ({CERT})")
        return
    print("\033[33m[TLS]\033[0m Generating self-signed certificate …")
    result = subprocess.run(
        [
            "openssl", "req", "-x509",
            "-newkey", "rsa:2048",
            "-keyout", KEY,
            "-out",    CERT,
            "-days",   "365",
            "-nodes",
            "-subj",   "/CN=127.0.0.1",
            "-addext", "subjectAltName=IP:127.0.0.1",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"\033[31m[ERR]\033[0m openssl failed:\n{result.stderr}")
        sys.exit(1)
    print(f"\033[32m[TLS]\033[0m Certificate written to {CERT} / {KEY}")


# ── Request handler ────────────────────────────────────────────────────────────

class SherlockHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        print(f"\033[36m[REQ]\033[0m {self.address_string()} — {fmt % args}")

    def _cors(self):
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    # Health-check — lets the user trust the cert by visiting https://127.0.0.1:7474/
    def do_GET(self):
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "service": "sherlock-server"}).encode())

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
                json.dumps({"error": "Invalid username — only letters, numbers, dots, hyphens, underscores (max 64)."}).encode()
            )
            return

        print(f"\033[32m[RUN]\033[0m sherlock {username}")

        # ── SSE response ────────────────────────────────────────────────────
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
                if line:
                    emit({"line": line})
            proc.wait()
            emit({"done": True, "returncode": proc.returncode})

        except FileNotFoundError:
            emit({"error": "sherlock not found — install with: pip install sherlock-project"})
            emit({"done": True, "returncode": 1})
        except BrokenPipeError:
            pass
        except Exception as exc:
            emit({"error": str(exc)})
            emit({"done": True, "returncode": 1})


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    generate_cert()

    try:
        httpd = http.server.ThreadingHTTPServer((HOST, PORT), SherlockHandler)
    except OSError as e:
        print(f"\033[31m[ERR]\033[0m Cannot bind {HOST}:{PORT} — {e}")
        sys.exit(1)

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(certfile=CERT, keyfile=KEY)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

    print(f"\033[36m")
    print(r"  ____  _               _            _    ")
    print(r" / ___|| |__   ___ _ __| | ___   ___| | __")
    print(r" \___ \| '_ \ / _ \ '__| |/ _ \ / __| |/ /")
    print(r"  ___) | | | |  __/ |  | | (_) | (__|   < ")
    print(r" |____/|_| |_|\___|_|  |_|\___/ \___|_|\_\\")
    print(f"\033[0m")
    print(f"\033[32m[*]\033[0m HTTPS server on \033[36mhttps://{HOST}:{PORT}\033[0m")
    print()
    print(f"\033[33m[!] ONE-TIME SETUP — trust the self-signed cert:\033[0m")
    print(f"    1. Open  \033[36mhttps://{HOST}:{PORT}/\033[0m  in your browser")
    print(f"    2. Click  Advanced → Proceed  (Chrome)  or  Accept the Risk  (Firefox)")
    print(f"    3. You should see  {{\"status\":\"ok\"}}  — you're done")
    print(f"    4. Open / reload Sherlock.html on GitHub Pages")
    print()
    print(f"\033[32m[*]\033[0m Ctrl+C to stop\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\033[33m[*]\033[0m Server stopped.")
        httpd.server_close()
