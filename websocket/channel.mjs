// --- Users Channel ---
const updateUsers = (wsServer) => {
  const clients = wsServer.getChannelClients(process.env.VITE_WS_CHANNEL_NAME);
  wsServer.pub(process.env.VITE_WS_CHANNEL_NAME, clients.length);
};

export function setupUsersChannel(wsServer) {
  wsServer.addChannel(process.env.VITE_WS_CHANNEL_NAME, {
    usersCanPub: false,
    usersCanSub: true,

    hookSubPost: () => {
      updateUsers(wsServer);
    },

    hookUnsubPost: () => {
      updateUsers(wsServer);
    },
  });
}