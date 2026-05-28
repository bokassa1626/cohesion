let io;

export function attachRealtime(socketServer) {
  io = socketServer;
  io.on('connection', (socket) => {
    socket.on('join-chat', (chatId) => socket.join(chatId));
    socket.on('typing', ({ chatId, user }) => {
      socket.to(chatId).emit('typing', { chatId, user });
    });
  });
}

export function emitRealtime(event, payload, room) {
  if (!io) return;
  if (room) io.to(room).emit(event, payload);
  else io.emit(event, payload);
}
