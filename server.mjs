import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = normalize(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const port = Number(process.env.PORT || process.argv[2] || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf"
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    let target = normalize(join(workspace, pathname));
    if (!target.startsWith(workspace)) throw new Error("Invalid path");
    const details = await stat(target).catch(() => null);
    if (details?.isDirectory()) target = join(target, "index.html");
    const content = await readFile(target);
    response.writeHead(200, { "Content-Type": mime[extname(target).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Nicht gefunden");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Three.js-Kindergarten: http://127.0.0.1:${port}/three-kindergarten/`);
});
