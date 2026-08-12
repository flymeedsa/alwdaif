import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

const clients = new Set<WebSocket>();
let wss: WebSocketServer | null = null;

export function setupWebSocket(httpServer: Server) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });
}

export function broadcast(event: string, payload?: any) {
  const message = JSON.stringify({ event, payload });
  for (const ws of Array.from(clients)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}
