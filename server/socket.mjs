import jwt from "jsonwebtoken";
import { WSServerPubSub, WSServerError } from "wsmini";
import { getSecretKey } from "../services/jwtServices.mjs";

const activeUsers = new Set();
const port = process.env.VITE_WS_PORT
  ? parseInt(process.env.VITE_WS_PORT)
  : 8888;
const origins = process.env.VITE_WS_HOST ?? "localhost";

class TrackingWSServer extends WSServerPubSub {
  /**
   * Handles client disconnection and cleanup
   * @override
   * @param {WebSocket} client - The WebSocket client that disconnected
   */
  onClose(client) {
    const metadata = this.clients.get(client);
    if (metadata?.userId) {
      activeUsers.delete(metadata.userId);
    }

    super.onClose(client);
  }
}

export const wsServer = new TrackingWSServer({
  port: port,
  origins: origins,
  pingTimeout: 30000,

  authCallback: (token, request, wsServer) => {
    if (!token) return false;

    let userId;

    try {
      const decoded = jwt.verify(token, getSecretKey());
      userId = decoded.sub;
    } catch (error) {
      return false;
    }

    if (activeUsers.has(userId)) return false;

    activeUsers.add(userId);
    return { userId };
  },
});

wsServer.addChannel("gps", {
  usersCanPub: true,
  usersCanSub: true,
  hookPub: (msg, client, wsServer) => {
    console.log("New GPS received : ", msg);
  },
  hookSub: (client, wsServer) => {
    console.log("tracking started");
    return true;
  },
  hookUnsub: (client, wsServer) => {
    console.log("tracking stopped");
    return true;
  },
});

wsServer.start();
