import http.server
import socketserver
import os
import webbrowser

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(__file__), "game")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Always serve the newest game files (no stale browser cache after updates)
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"==================================================")
        print(f" Thenerean Selvabankumar - Das GIBB Abenteuer ")
        print(f" Spielbar unter: http://localhost:{PORT}")
        print(f"==================================================")
        webbrowser.open(f"http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer beendet.")

if __name__ == "__main__":
    run()
