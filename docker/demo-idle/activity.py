import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

STATE = Path('/state/last-activity')
ALLOWED_ORIGINS = {
    'https://liakos-messenger.duckdns.org',
    'http://localhost:5173',
}


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/':
            self.send_error(404)
            return
        if self.headers.get('Origin') not in ALLOWED_ORIGINS:
            self.send_error(403)
            return
        if (self.headers.get('Transfer-Encoding')
                or self.headers.get('Content-Length', '0') != '0'):
            self.send_error(400)
            return
        temporary = STATE.with_suffix('.tmp')
        temporary.write_text(str(time.time()), encoding='utf-8')
        os.replace(temporary, STATE)
        self.send_response(204)
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()

    def log_message(self, format, *args):
        pass


if __name__ == '__main__':
    STATE.parent.mkdir(parents=True, exist_ok=True)
    HTTPServer(('0.0.0.0', 8080), Handler).serve_forever()
