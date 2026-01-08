import http.server
import socketserver
import os
import sys

# Add src to path to import config
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from src import config

PORT = config.FRONTEND_PORT
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    print(f"Starting Frontend on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping Frontend...")
            httpd.shutdown()

if __name__ == "__main__":
    run()
