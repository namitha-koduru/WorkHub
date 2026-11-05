import { Server } from 'socket.io';
import { ENV } from './env.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          origin === ENV.CLIENT_URL ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user-specific notification channel
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user:${userId}`);
      }
    });

    // Join workspace updates channel
    socket.on('join_workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined workspace:${workspaceId}`);
      }
    });

    // Join room channel (for room Kanban, chat, plans)
    socket.on('join_room', (roomId) => {
      if (roomId) {
        socket.join(`room:${roomId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room:${roomId}`);
      }
    });

    socket.on('leave_room', (roomId) => {
      if (roomId) {
        socket.leave(`room:${roomId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left room:${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized! Call initSocket first.');
  }
  return io;
};

