import UsersSchema from "../models/UsersSchema.mjs";

// --- Users Channel ---
const updateUsers = (wsServer) => {
  const clients = wsServer.getChannelClients(process.env.VITE_WS_CHANNEL_NAME);
  wsServer.pub(process.env.VITE_WS_CHANNEL_NAME, { type: "users_count", count: clients.length });
};

// Calcule et retourne les totaux de la communauté
const getCommunityTotals = async () => {
  try {
    const result = await UsersSchema.aggregate([
      {
        $group: {
          _id: null,
          totalKmEver: { $sum: "$activityStats.totalKmEver" },
          totalTimeEver: { $sum: "$activityStats.totalTimeEver" },
          totalActivitiesEver: {
            $sum: "$activityStats.totalActivitiesEver",
          },
          totalElevationEver: { $sum: "$activityStats.totalElevationEver" },
          totalUsers: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalKmEver: 1,
          totalTimeEver: 1,
          totalActivitiesEver: 1,
          totalElevationEver: 1,
          totalUsers: 1,
        },
      },
    ]);

    return result[0] || {
      totalKmEver: 0,
      totalTimeEver: 0,
      totalActivitiesEver: 0,
      totalElevationEver: 0,
      totalUsers: 0,
    };
  } catch (error) {
    console.error("[WebSocket] Error calculating community totals:", error);
    return {
      totalKmEver: 0,
      totalTimeEver: 0,
      totalActivitiesEver: 0,
      totalElevationEver: 0,
      totalUsers: 0,
    };
  }
};

// Broadcast les totaux de la communauté à tous les clients connectés
export const broadcastCommunityTotals = async (wsServer) => {
  const totals = await getCommunityTotals();
  wsServer.pub(process.env.VITE_WS_CHANNEL_NAME, {
    type: "community_totals",
    data: totals
  });
};

export function setupUsersChannel(wsServer) {
  wsServer.addChannel(process.env.VITE_WS_CHANNEL_NAME, {
    usersCanPub: true,
    usersCanSub: true,

    hookSubPost: async () => {
      updateUsers(wsServer);
      // Envoyer les totaux de la communauté au nouveau client
      await broadcastCommunityTotals(wsServer);
    },

    hookUnsubPost: () => {
      updateUsers(wsServer);
    },
  });
}
