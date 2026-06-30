import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8765);
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".pcm", "application/octet-stream"],
  [".css", "text/css; charset=utf-8"]
]);

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const target = path.resolve(root, "." + requested);
  return target.startsWith(root + path.sep) || target === root ? target : null;
}

const server = http.createServer((req, res) => {
  const target = safePath(req.url || "/");
  if (!target) return send(res, 403, { "content-type": "text/plain" }, "Forbidden");
  fs.stat(target, (statError, stat) => {
    if (statError || !stat.isFile()) {
      return send(res, 404, { "content-type": "text/plain" }, "Not found");
    }

    const type = mime.get(path.extname(target).toLowerCase()) || "application/octet-stream";
    const range = req.headers.range;
    const commonHeaders = {
      "accept-ranges": "bytes",
      "cache-control": "no-store",
      "content-type": type
    };

    if (range) {
      const match = range.match(/^bytes=(\d*)-(\d*)$/);
      if (!match) {
        return send(res, 416, { ...commonHeaders, "content-range": `bytes */${stat.size}` }, "");
      }
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
        return send(res, 416, { ...commonHeaders, "content-range": `bytes */${stat.size}` }, "");
      }
      res.writeHead(206, {
        ...commonHeaders,
        "content-length": end - start + 1,
        "content-range": `bytes ${start}-${end}/${stat.size}`
      });
      if (req.method === "HEAD") return res.end();
      return fs.createReadStream(target, { start, end }).pipe(res);
    }

    res.writeHead(200, { ...commonHeaders, "content-length": stat.size });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}/`);
});
