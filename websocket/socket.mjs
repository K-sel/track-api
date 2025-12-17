import { WSServerPubSub } from "wsmini";
import { setupUsersChannel } from "./channel.mjs";
import "dotenv/config";

const origins = process.env.VITE_WS_HOST ?? "localhost";

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
