import os
import sys
import json
import threading
import socket
import http.server
import socketserver
import tempfile
from urllib.parse import urlparse

# Allow instant audio playback during the 10-second opening splash inside Edge WebView2
os.environ.setdefault("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--autoplay-policy=no-user-gesture-required")

_SAVE_LOCK = threading.Lock()


def get_base_dir():
    # If bundled via PyInstaller, sys._MEIPASS holds the temp directory
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


def get_app_dir():
    # Directory containing Thenerean_Selvabankumar.exe (portable local save!)
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def get_fallback_data_dir():
    base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~") or tempfile.gettempdir()
    return os.path.join(base, "ThenereanSelvabankumar")


def get_save_candidates(save_path_override=None):
    if save_path_override:
        return [save_path_override]
    return [
        os.path.join(get_app_dir(), "thenerean_save.json"),
        os.path.join(get_fallback_data_dir(), "thenerean_save.json"),
    ]


def _normalize_save_dict(raw):
    data = {"version": 1, "levels": {}, "prefs": {}}
    if not isinstance(raw, dict):
        return data
    raw_levels = raw.get("levels")
    if isinstance(raw_levels, dict):
        for k, v in raw_levels.items():
            if not isinstance(v, dict) or not v.get("cleared"):
                continue
            try:
                grade = float(v.get("bestGrade", 5.5))
            except (TypeError, ValueError):
                grade = 5.5
            try:
                btime = max(0, int(round(float(v.get("bestTime", 0)))))
            except (TypeError, ValueError):
                btime = 0
            try:
                bcombo = max(0, int(v.get("bestCombo", 0)))
            except (TypeError, ValueError):
                bcombo = 0
            data["levels"][str(k)] = {
                "cleared": True,
                "bestGrade": round(grade, 1),
                "bestTime": btime,
                "bestCombo": bcombo,
            }
    raw_prefs = raw.get("prefs")
    if isinstance(raw_prefs, dict):
        prefs = {}
        if raw_prefs.get("difficulty") in ("easy", "normal", "hard", "nightmare"):
            prefs["difficulty"] = raw_prefs["difficulty"]
        try:
            st = int(raw_prefs.get("soundTier", 0))
            if st in (1, 2, 3):
                prefs["soundTier"] = st
        except (TypeError, ValueError):
            pass
        if isinstance(raw_prefs.get("menuMusic"), str) and raw_prefs["menuMusic"].startswith("assets/music/"):
            prefs["menuMusic"] = raw_prefs["menuMusic"]
        data["prefs"] = prefs
    # V9: coins, shop upgrades, achievements & lifetime stats (validated client-side)
    raw_meta = raw.get("meta")
    if isinstance(raw_meta, dict) and isinstance(raw_meta.get("stats"), dict):
        data["meta"] = raw_meta
    return data


def _merge_save_dicts(existing, incoming):
    base = _normalize_save_dict(existing)
    inc = _normalize_save_dict(incoming)
    merged = {"version": 1, "levels": dict(base["levels"]), "prefs": dict(base["prefs"])}

    for k, rec in inc["levels"].items():
        prev = merged["levels"].get(k)
        if not prev:
            merged["levels"][k] = rec
        else:
            prev_t = prev.get("bestTime", 0) or 0
            inc_t = rec.get("bestTime", 0) or 0
            if prev_t > 0 and inc_t > 0:
                best_time = min(prev_t, inc_t)
            else:
                best_time = prev_t or inc_t
            merged["levels"][k] = {
                "cleared": True,
                "bestGrade": round(max(prev.get("bestGrade", 0), rec.get("bestGrade", 0)), 1),
                "bestTime": best_time,
                "bestCombo": max(prev.get("bestCombo", 0), rec.get("bestCombo", 0)),
            }

    for pk, pv in inc["prefs"].items():
        merged["prefs"][pk] = pv

    def _earned(d):
        try:
            return float(d["meta"]["stats"].get("coinsEarned", 0))
        except (KeyError, TypeError, ValueError):
            return -1.0

    best = inc if _earned(inc) >= _earned(base) else base
    if "meta" in best:
        merged["meta"] = best["meta"]

    return merged


def read_local_save(save_path_override=None):
    with _SAVE_LOCK:
        for path in get_save_candidates(save_path_override):
            if os.path.isfile(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        return _normalize_save_dict(json.load(f))
                except Exception:
                    continue
        return _normalize_save_dict({})


def write_local_save(incoming_payload, save_path_override=None):
    with _SAVE_LOCK:
        existing = {}
        for path in get_save_candidates(save_path_override):
            if os.path.isfile(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        existing = json.load(f)
                    break
                except Exception:
                    continue

        merged = _merge_save_dicts(existing, incoming_payload)
        encoded = json.dumps(merged, indent=2, ensure_ascii=False)

        for path in get_save_candidates(save_path_override):
            try:
                parent = os.path.dirname(os.path.abspath(path))
                if parent:
                    os.makedirs(parent, exist_ok=True)
                tmp_path = f"{path}.{os.getpid()}.tmp"
                with open(tmp_path, "w", encoding="utf-8") as f:
                    f.write(encoded)
                os.replace(tmp_path, path)
                return path, merged
            except Exception:
                continue
        return None, merged


def reset_local_save(incoming_payload=None, save_path_override=None):
    with _SAVE_LOCK:
        existing_prefs = {}
        for path in get_save_candidates(save_path_override):
            if os.path.isfile(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        existing_prefs = _normalize_save_dict(json.load(f)).get("prefs", {})
                    break
                except Exception:
                    continue

        inc_norm = _normalize_save_dict(incoming_payload or {})
        merged_prefs = dict(existing_prefs)
        merged_prefs.update(inc_norm.get("prefs", {}))
        cleared = {"version": 1, "levels": {}, "prefs": merged_prefs}
        encoded = json.dumps(cleared, indent=2, ensure_ascii=False)

        first_saved = None
        for path in get_save_candidates(save_path_override):
            try:
                if not os.path.isfile(path) and first_saved is not None:
                    continue
                parent = os.path.dirname(os.path.abspath(path))
                if parent:
                    os.makedirs(parent, exist_ok=True)
                tmp_path = f"{path}.{os.getpid()}.tmp"
                with open(tmp_path, "w", encoding="utf-8") as f:
                    f.write(encoded)
                os.replace(tmp_path, path)
                if first_saved is None:
                    first_saved = path
            except Exception:
                continue
        return first_saved, cleared


def make_handler(directory, save_path_override=None):
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)

        def log_message(self, format, *args):
            pass  # suppress console logging

        def _send_json(self, status, obj):
            body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/api/save":
                data = read_local_save(save_path_override=save_path_override)
                self._send_json(200, {"ok": True, "data": data})
                return
            super().do_GET()

        def do_POST(self):
            parsed = urlparse(self.path)
            if parsed.path == "/api/save":
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    length = 0
                raw_bytes = self.rfile.read(max(0, min(length, 1048576)))
                try:
                    payload = json.loads(raw_bytes.decode("utf-8")) if raw_bytes else {}
                except Exception:
                    self._send_json(400, {"ok": False, "error": "invalid json"})
                    return
                if isinstance(payload, dict) and payload.get("action") == "reset_levels":
                    saved_path, cleared = reset_local_save(payload, save_path_override=save_path_override)
                    self._send_json(200, {"ok": bool(saved_path), "data": cleared})
                    return
                saved_path, merged = write_local_save(payload, save_path_override=save_path_override)
                self._send_json(200, {"ok": bool(saved_path), "data": merged})
                return
            self.send_error(404, "Not Found")

    return QuietHandler


class ReusableServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):
        exc = sys.exc_info()[1]
        if isinstance(exc, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError)):
            return
        super().handle_error(request, client_address)


def get_preferred_port(candidates=(18942, 18943, 18944, 18945, 18946)):
    for p in candidates:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", p))
                return p
        except OSError:
            continue
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def run_server(directory, port, save_path_override=None):
    handler = make_handler(directory, save_path_override=save_path_override)
    with ReusableServer(("127.0.0.1", port), handler) as httpd:
        httpd.serve_forever()


def main():
    import webview

    base_dir = get_base_dir()
    game_dir = os.path.join(base_dir, "game")
    port = get_preferred_port()

    storage_dir = os.path.join(get_fallback_data_dir(), "webview_data")
    try:
        os.makedirs(storage_dir, exist_ok=True)
    except Exception:
        storage_dir = None

    # Start local background HTTP server (serves game + /api/save local disk persistence)
    server_thread = threading.Thread(target=run_server, args=(game_dir, port), daemon=True)
    server_thread.start()

    # Launch native desktop window with modern WebView2 engine + persistent local save
    url = f"http://127.0.0.1:{port}/index.html?platform=desktop&localSave=1"
    webview.create_window(
        title="Thenerean Selvabankumar - Das GIBB Abenteuer",
        url=url,
        width=1280,
        height=760,
        min_size=(960, 540),
        resizable=True,
        maximized=True,
        fullscreen=False
    )
    start_kwargs = {"gui": "edgechromium", "private_mode": False}
    if storage_dir:
        start_kwargs["storage_path"] = storage_dir
    webview.start(**start_kwargs)


if __name__ == "__main__":
    main()
