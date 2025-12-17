import { WSServerPubSub } from "wsmini";
import { setupUsersChannel } from "./channel.mjs";
import "dotenv/config";

const port = process.env.PROD
  ? parseInt(process.env.PORT || 3030)
  : parseInt(process.env.VITE_WS_PORT || 8080);

const origins = process.env.VITE_WS_HOST ?? "localhost";

export const wsServer = new WSServerPubSub({
  port: port,
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

wsServer.start();
