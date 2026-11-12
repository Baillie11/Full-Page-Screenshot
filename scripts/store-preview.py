"""Serve the real popup in an isolated, non-interactive listing preview."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

root = Path(__file__).resolve().parents[1]
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/popup.html':
            html = (root/'chrome-extension/popup.html').read_text(encoding='utf-8')
            html = html.replace('<script src="popup.js"></script>', '')
            html = html.replace('Loading...', 'https://example.com/')
            html = html.replace('<button class="capture-btn"', '<button disabled class="capture-btn"')
        else:
            html = '''<!doctype html><html lang="en"><meta charset="utf-8"><title>Full Page Screenshot — listing preview</title><style>
            *{box-sizing:border-box}body{margin:0;background:#eef6fc;font-family:Arial,sans-serif;color:#252d55}.canvas{width:1280px;height:800px;padding:76px 80px;display:flex;align-items:center;gap:70px}.copy{width:610px}.brand{font-size:19px;font-weight:bold;color:#0575b8;letter-spacing:2px}h1{font-size:68px;line-height:1.05;letter-spacing:-3px;margin:30px 0}p{font-size:25px;line-height:1.5;color:#4b5673}.chips{display:flex;gap:12px;margin-top:32px}.chips span{border:1px solid #b2cddd;border-radius:24px;padding:12px 17px;font-size:17px}.ui{background:white;border-radius:20px;padding:20px;box-shadow:0 16px 50px #1d416920}iframe{width:360px;height:284px;border:0;border-radius:12px}.caption{font-size:15px;text-align:center;color:#607088;margin-bottom:0}</style>
            <div class="canvas"><div class="copy"><div class="brand">CLICK ECOMMERCE</div><h1>Full Page<br>Screenshot</h1><p>Capture beyond the browser window.<br>Copy your image or save a PNG.</p><div class="chips"><span>Full-page PNG</span><span>Clipboard copy</span><span>Local processing</span></div></div><div class="ui"><iframe src="/popup.html" title="Extension popup preview"></iframe><p class="caption">Chrome extension · Interface preview</p></div></div></html>'''
        body = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
HTTPServer(('127.0.0.1',8766),Handler).serve_forever()
