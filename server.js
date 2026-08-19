import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.get("/", (req, res) => res.send("Chat server running"));

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // simplest for this demo; restrict later if needed
    methods: ["GET", "POST"]
  }
});

// Simple in-memory history (works for demo/free tier)
const MAX_HISTORY = 50;
let history = [];

function nowTs() {
  return Date.now();
}

function sanitizeText(s) {
  // Basic sanitation: trim and cap length; client also escapes HTML for display
  return String(s).trim().slice(0, 1000);
}

io.on("connection", (socket) => {
  // Send recent history on connect
  socket.emit("chat:history", history);

  socket.on("chat:send", (payload) => {
    const name = String(payload?.name ?? "").trim().slice(0, 24);
    const text = sanitizeText(payload?.text ?? "");

    if (!name || !text) return;

    const msg = {
      id: cryptoId(),
      name,
      text,
      ts: nowTs()
    };

    history.push(msg);
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

    io.emit("chat:message", msg);
  });
});

function cryptoId() {
  // Lightweight unique-ish id without extra deps
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});