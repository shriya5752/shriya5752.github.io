#!/usr/bin/env python3
"""Local preview server for ./site that never lets the browser cache files,
so edits show up on a normal refresh.

USAGE:
    python scripts/serve.py            # serves http://localhost:8765/
"""

import functools
import http.server
from pathlib import Path

PORT = 8765
ROOT = Path(__file__).resolve().parent.parent / "site"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as srv:
        print(f"serving {ROOT} at http://localhost:{PORT}/")
        srv.serve_forever()
