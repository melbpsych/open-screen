"""Local development server. Static files only; no response collection."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
# Development assets only. A checkout can later contain .env files, backups,
# patient exports, or research data; none should become public by accident.
PUBLIC_DIRECTORIES = {"core", "gates", "measures", "config", "questionnaires"}
PUBLIC_SUFFIXES = {".js", ".json", ".css", ".svg", ".html"}
ROOT_ASSETS = {
    "index.html", "interview.html", "styles.css", "interview.css", "favicon.svg",
    "app.js", "interview.js", "ui.js", "presentation.js", "policy.js", "api.js", "app-config.js", "bootstrap.js",
    "logic.html", "logic.js", "logic.css", "workspace-ui.js", "review-ui.js", "help.html", "help.css",
}
CSP = "; ".join([
    "default-src 'none'", "script-src 'self'", "connect-src 'self'",
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data:",
    "base-uri 'none'", "form-action 'none'", "object-src 'none'",
    "frame-ancestors 'none'",
])


class Handler(SimpleHTTPRequestHandler):
    root = ROOT
    server_version = "OpenScreen"
    sys_version = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(self.root), **kwargs)

    def send_head(self):
        # A hostile website must not use DNS rebinding to read localhost assets.
        try:
            host = urlsplit("//" + self.headers.get("Host", ""))
            valid_host = host.hostname in {"127.0.0.1", "localhost", "::1"} and host.port == self.server.server_port and host.username is None and host.password is None
        except ValueError:
            valid_host = False
        if not valid_host:
            self.send_error(403, "Local host required")
            return None
        path = unquote(urlsplit(self.path).path)
        parts = Path(path.lstrip("/")).parts
        if "\\" in path or any(part.startswith(".") for part in parts):
            self.send_error(403, "Private path")
            return None
        target = self.root.joinpath(*parts) if parts else self.root / "index.html"
        source_pdf = len(parts) == 3 and parts[:2] == ("docs", "sources") and target.suffix == ".pdf"
        public = (target.name in ROOT_ASSETS if len(parts) <= 1 else parts[0] in PUBLIC_DIRECTORIES and target.suffix in PUBLIC_SUFFIXES)
        # Check symlinks before delegating: SimpleHTTPRequestHandler follows them.
        symlink = any(parent.is_symlink() for parent in [target, *target.parents] if parent != self.root and self.root in parent.parents)
        if not (source_pdf or public) or symlink or not target.resolve().is_relative_to(self.root.resolve()):
            self.send_error(403, "Not a public asset")
            return None
        if target.is_dir():
            self.send_error(403, "Directory listing disabled")
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(403, "Directory listing disabled")
        return None

    def log_message(self, format, *args):
        # Request URLs can contain identifiers. Do not record query strings.
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        super().end_headers()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    print(f"Open Screen: http://127.0.0.1:{args.port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
