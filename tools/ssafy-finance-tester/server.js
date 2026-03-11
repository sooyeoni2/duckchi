const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const HOST = "127.0.0.1";
const PORT = process.env.PORT ? Number(process.env.PORT) : 43120;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      sendJson(res, 404, { success: false, message: "File not found." });
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    });
    res.end(buffer);
  });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error("Request body is too large."));
      }
    });

    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function proxyRequest(payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(payload.url);
    const client = target.protocol === "https:" ? https : http;
    const requestBody = payload.body ? JSON.stringify(payload.body) : "";

    const options = {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: target.pathname + target.search,
      method: payload.method || "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(payload.headers ?? {}),
      },
    };

    if (requestBody) {
      options.headers["Content-Length"] = Buffer.byteLength(requestBody);
    }

    const outgoing = client.request(options, (incoming) => {
      let responseText = "";

      incoming.on("data", (chunk) => {
        responseText += chunk;
      });

      incoming.on("end", () => {
        resolve({
          status: incoming.statusCode ?? 500,
          statusMessage: incoming.statusMessage ?? "",
          headers: incoming.headers,
          bodyText: responseText,
        });
      });
    });

    outgoing.on("error", reject);

    if (requestBody) {
      outgoing.write(requestBody);
    }

    outgoing.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  if (req.url === "/proxy" && req.method === "POST") {
    try {
      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw || "{}");

      if (!payload.url) {
        sendJson(res, 400, { success: false, message: "url is required." });
        return;
      }

      const startedAt = Date.now();
      const proxied = await proxyRequest(payload);
      const durationMs = Date.now() - startedAt;

      let parsedBody = null;
      try {
        parsedBody = proxied.bodyText ? JSON.parse(proxied.bodyText) : null;
      } catch (error) {
        parsedBody = null;
      }

      sendJson(res, 200, {
        success: true,
        durationMs,
        ...proxied,
        parsedBody,
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        message: error.message || "Proxy request failed.",
      });
    }
    return;
  }

  const requestUrl = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestUrl).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { success: false, message: "Forbidden." });
    return;
  }

  sendFile(res, filePath);
});

server.listen(PORT, HOST, () => {
  console.log("SSAFY Finance Tester is running at http://" + HOST + ":" + PORT);
});
