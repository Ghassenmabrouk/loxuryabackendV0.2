const { Server } = require('socket.io');

const initializeSocket = (server, allowedOrigins) => {
  const notificationIo = new Server(server, {
    path: '/notification-socket',
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Socket.IO logic for notifications
  notificationIo.on('connection', (socket) => {
    console.log('User  connected for notifications:', socket.id);

    // Join a user to their room
    socket.on('joinRoom', (userId) => {
      socket.join(userId); // Join the room with the user's ID
      console.log(`User  ${userId} joined room ${userId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User  disconnected from notifications:', socket.id);
    });
  });

  return notificationIo;
};

module.exports = initializeSocket;
