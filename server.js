import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

// Render receives https/wss requests, terminates SSL, and forwards http traffic here
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Wire Server Active");
});

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws, req) => {
  clients.add(ws);
  const ip = req.socket.remoteAddress;
  console.log(`[+] Client connected from ${ip}. Total: ${clients.size}`);

  ws.on("message", (data) => {
    let payload;
    try {
      const parsed = JSON.parse(data.toString());
      payload = JSON.stringify({
        name: parsed.name || "guest",
        text: parsed.text || "",
      });
    } catch {
      payload = JSON.stringify({
        name: "guest",
        text: data.toString(),
      });
    }

    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[-] Client disconnected. Total: ${clients.size}`);
  });

  ws.on("error", (err) => console.error(`[!] WS Error: ${err.message}`));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
