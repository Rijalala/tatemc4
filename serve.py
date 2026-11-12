import http.server
import socketserver
import os
import re

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def send_head(self):
        if 'Range' not in self.headers:
            self.range_last = None
            return super().send_head()

        path = self.translate_path(self.path)
        f = None
        ctype = self.guess_type(path)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        total_len = fs[6]

        range_header = self.headers['Range'].strip()
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not range_match:
            self.range_last = None
            f.close()
            return super().send_head()

        first, last = range_match.groups()
        first = int(first) if first else 0
        last = int(last) if last else total_len - 1
        if last >= total_len:
            last = total_len - 1
        if first > last or first >= total_len:
            self.send_error(416, "Requested Range Not Satisfiable")
            f.close()
            return None

        content_length = (last - first) + 1
        self.send_response(206)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Range', f'bytes {first}-{last}/{total_len}')
        self.send_header('Content-Length', str(content_length))
        self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
        self.end_headers()
        f.seek(first)
        self.range_last = last
        return f

    def copyfile(self, source, outputfile):
        if not hasattr(self, 'range_last') or self.range_last is None:
            return super().copyfile(source, outputfile)
        
        remaining = self.range_last - source.tell() + 1
        buffer_size = 64 * 1024
        while remaining > 0:
            read_size = min(buffer_size, remaining)
            buf = source.read(read_size)
            if not buf:
                break
            try:
                outputfile.write(buf)
            except (ConnectionResetError, BrokenPipeError):
                break
            remaining -= len(buf)

if __name__ == '__main__':
    with ThreadingHTTPServer(("", PORT), RangeHTTPRequestHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()
