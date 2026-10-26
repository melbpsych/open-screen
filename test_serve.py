"""Real HTTP checks against an ephemeral localhost server, with synthetic files."""
import http.client
from pathlib import Path
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer

from serve import Handler


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        (root / "index.html").write_text("<h1>Example</h1>")
        for name in ["logic.html", "logic.js", "logic.css"]:
            (root / name).write_text("/* Public logic page fixture */")
        (root / ".env").write_text("PRIVATE")
        (root / "patient.html").write_text("PRIVATE")
        (root / "core").mkdir()
        (root / "core" / "link.js").symlink_to(root / ".env")
        (root / "core" / "score.js").write_text("export const example = 1")
        (root / "config").mkdir()
        (root / "config" / "policy.json").write_text("{}")
        class TestHandler(Handler):
            pass
        TestHandler.root = root
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), TestHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.tmp.cleanup()

    def request(self, path, method="GET", headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        conn.request(method, path, headers=headers or {})
        response = conn.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        conn.close()
        return result

    def test_assets_and_security_headers(self):
        for path in ["/", "/index.html", "/logic.html", "/logic.js", "/logic.css", "/core/score.js", "/config/policy.json"]:
            status, headers, _ = self.request(path)
            self.assertEqual(status, 200, path)
            self.assertEqual(headers["Cache-Control"], "no-store")
            self.assertEqual(headers["Referrer-Policy"], "no-referrer")
            self.assertIn("script-src 'self'", headers["Content-Security-Policy"])
            self.assertIn("frame-ancestors 'none'", headers["Content-Security-Policy"])
            self.assertNotIn("Access-Control-Allow-Origin", headers)

    def test_private_paths_traversal_symlinks_and_directories(self):
        for path in ["/.env", "/%2eenv", "/../.env", "/%2e%2e/.env", "/core/link.js", "/core/", "/serve.py", "/patient.html", "/backup.tar.gz"]:
            status, _, body = self.request(path)
            self.assertEqual(status, 403, path)
            self.assertNotIn(b"PRIVATE", body)

    def test_host_rebinding_and_unsupported_writes(self):
        self.assertEqual(self.request("/", headers={"Host": "attacker.example:8765"})[0], 403)
        self.assertEqual(self.request("/", method="POST")[0], 501)

    def test_head_and_missing_asset(self):
        status, _, body = self.request("/core/score.js", method="HEAD")
        self.assertEqual(status, 200)
        self.assertEqual(body, b"")
        self.assertEqual(self.request("/core/missing.js")[0], 404)


if __name__ == "__main__":
    unittest.main()
