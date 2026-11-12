import os
import sys
import threading
import socket
import http.server
import socketserver

# Allow instant audio playback during the 10-second opening splash inside Edge WebView2
os.environ.setdefault("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--autoplay-policy=no-user-gesture-required")

import webview

def get_base_dir():
    # If bundled via PyInstaller, sys._MEIPASS holds the temp directory
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_server(directory, port):
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)
        def log_message(self, format, *args):
            pass # suppress console logging

    with socketserver.TCPServer(("127.0.0.1", port), QuietHandler) as httpd:
        httpd.serve_forever()

def main():
    base_dir = get_base_dir()
    game_dir = os.path.join(base_dir, "game")
    port = get_free_port()

    # Start local background HTTP server
    server_thread = threading.Thread(target=run_server, args=(game_dir, port), daemon=True)
    server_thread.start()

    # Launch native desktop window with modern WebView2 engine
    url = f"http://127.0.0.1:{port}/index.html?platform=desktop"
    window = webview.create_window(
        title="Thenerean Selvabankumar - Das GIBB Abenteuer",
        url=url,
        width=1280,
        height=760,
        min_size=(960, 540),
        resizable=True,
        maximized=True,
        fullscreen=False
    )
    webview.start(gui="edgechromium")

if __name__ == "__main__":
    main()
