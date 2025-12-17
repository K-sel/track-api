import { WSServerPubSub } from "wsmini";
import { setupUsersChannel } from "./channel.mjs";
import "dotenv/config";

// Configure origins based on environment
const origins = process.env.NODE_ENV === "production"
  ? ["https://track-front.onrender.com"]
  : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];

export const wsServer = new WSServerPubSub({
  origins: origins,
  maxNbOfClients: 500,
  maxInputSize: 50000,
  pingTimeout: 30000,
  logLevel: "info",

  authCallback: (username, request, wsServer) => {
    return true;
  },
});

setupUsersChannel(wsServer);

// Export function to start WebSocket server with HTTP server
export function startWebSocket(httpServer) {
  wsServer.start ({ server: httpServer });
}
