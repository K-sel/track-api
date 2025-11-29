import jwt from "jsonwebtoken";
import { WSServerPubSub } from "wsmini";
import { getSecretKey } from "../services/jwtServices.mjs";
import { WGStoLV95 } from "swiss-projection";
import { trackElevation } from "./trackElevation.mjs";

const activeUsers = new Set();
let isServerStarted = false;
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
  hookPub: async (data, client, wsServer) => {
    if (!data.lat || !data.long) return;

    const wgsCoordinates = [data.long, data.lat];
    const elevationData = await getAltitude(wgsCoordinates);

    // Enregistrer les données de tracking
    await trackElevation(data, elevationData);

    const coordinates = { ...data, ...elevationData };
    console.log("Coords received : ", coordinates);
  },
  hookSub: async (client, wsServer) => {
    return true;
  },
  hookUnsub: async (client, wsServer) => {
    return true;
  },
});

// Ne démarrer que si le serveur n'est pas déjà lancé et que nous ne lançons pas "npm test"
const isTestEnvironment = process.env.DATABASE_URL?.includes("test");

if (!isServerStarted && !isTestEnvironment) {
  wsServer.start();
  isServerStarted = true;
}

const getAltitude = async (wgsCoordinates) => {
  const lv95Coordinates = WGStoLV95(wgsCoordinates);
  const response = await fetch(
    `https://api3.geo.admin.ch/rest/services/height?easting=${lv95Coordinates[0]}&northing=${lv95Coordinates[1]}`
  );
  return await response.json();
};
