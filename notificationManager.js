const { Server } = require('socket.io');

let notificationIo;

const initializeNotificationIo = (server, allowedOrigins) => {
  notificationIo = new Server(server, {
    path: '/notification-socket',
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  notificationIo.on('connection', (socket) => {
    console.log('User  connected for notifications:', socket.id);

    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      console.log(`User  ${userId} joined room ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('User  disconnected from notifications:', socket.id);
    });
  });
};

const sendPushNotification = (userId, message) => {
  if (!notificationIo) {
    console.error('notificationIo is not initialized');
    return;
  }
  console.log(`Sending push notification to user ${userId}: ${message}`);
  notificationIo.to(userId).emit('pushNotification', { message });
};

module.exports = {
  initializeNotificationIo,
  sendPushNotification,
};
