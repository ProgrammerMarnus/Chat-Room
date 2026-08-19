import { WebSocketServer, WebSocket } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Track connected clients
const clients = new Set();

wss.on("connection", (ws, req) => {
  clients.add(ws);
  const ip = req.socket.remoteAddress;
  console.log(`[+] Client connected from ${ip}. Total clients: ${clients.size}`);

  ws.on("message", (data) => {
    let payload;
    
    // Attempt to parse expected JSON payload structure
    try {
      const parsed = JSON.parse(data.toString());
      payload = JSON.stringify({
        name: parsed.name || "guest",
        text: parsed.text || "",
      });
    } catch {
      // Fallback for plain-text messages
      payload = JSON.stringify({
        name: "guest",
        text: data.toString(),
      });
    }

    // Broadcast message to all OTHER connected clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[-] Client disconnected. Total clients: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error(`[!] WebSocket error: ${error.message}`);
  });
});

console.log(`🚀 Wire WebSocket server running on ws://localhost:${PORT}`);
