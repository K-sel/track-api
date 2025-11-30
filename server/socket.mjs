import jwt from "jsonwebtoken";
import { WSServerPubSub } from "wsmini";

import { getSecretKey } from "../services/jwtServices.mjs";
import activityService from "./services/activityService.mjs";
import { altitudeService } from "./services/altitudeService.mjs";
import Tracker from "./classes/Tracker.mjs";

const activeUsers = new Set();
const port = process.env.VITE_WS_PORT
  ? parseInt(process.env.VITE_WS_PORT)
  : 8888;
const origins = process.env.VITE_WS_HOST ?? "localhost";

let isServerStarted = false;

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

  hookPub: async (data, clientMetadata, wsServer) => {
    if (!data.lat || !data.long) return;

    const wgsCoordinates = [data.long, data.lat];
    const elevationData = await altitudeService.getAltitude(wgsCoordinates);

    const tracker = clientMetadata.tracker;

    const geoJsonPoint = {
      geometry: {
        type: "Point",
        coordinates: [data.long, data.lat],
      },
      timestamp: Date.now(),
      altitude: elevationData.height,
    };

    // Update start/end positions in database
    if (data.start) {
      await tracker.updateStartPosition(geoJsonPoint);
    }

    if (data.stop) {
      await tracker.updateEndPosition(geoJsonPoint);
    }

    // Process GPS point through tracker
    tracker.processGpsPoint(geoJsonPoint, elevationData, data.start, data.stop);
  },

  hookSub: async (clientMetadata, wsServer) => {
    const userId = clientMetadata.userId;
    if (!userId) return false;

    const activityId = await activityService.createBlankActivity(userId);
    clientMetadata.activityId = activityId;

    const tracker = new Tracker(userId, activityId);
    clientMetadata.tracker = tracker;

    // Initialize GPS trace
    await tracker.initGpsTrace();
    tracker.startPeriodicSave();

    return true;
  },

  hookUnsub: async (clientMetadata, wsServer) => {
    const tracker = clientMetadata.tracker;
    await tracker.stopPeriodicSave();
    await tracker.finalizeGpsTrace("finished");
    return true;
  },
});

const isTestEnvironment = process.env.DATABASE_URL?.includes("test"); // Ne démarrer que si le serveur n'est pas déjà lancé et que nous ne lançons pas "npm test"

if (!isServerStarted && !isTestEnvironment) {
  wsServer.start();
  isServerStarted = true;
}
