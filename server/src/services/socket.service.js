import { getIO } from '../config/socket.js';

export const emitToUser = (userId, eventName, payload) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(eventName, payload);
  } catch (err) {
    // Socket might not be connected or initialized in some test scenarios
    console.debug(`[Socket Notice] Could not emit to user ${userId}:`, err.message);
  }
};

export const emitToRoom = (roomId, eventName, payload) => {
  try {
    const io = getIO();
    io.to(`room:${roomId}`).emit(eventName, payload);
  } catch (err) {
    console.debug(`[Socket Notice] Could not emit to room ${roomId}:`, err.message);
  }
};

export const emitToWorkspace = (workspaceId, eventName, payload) => {
  try {
    const io = getIO();
    io.to(`workspace:${workspaceId}`).emit(eventName, payload);
  } catch (err) {
    console.debug(`[Socket Notice] Could not emit to workspace ${workspaceId}:`, err.message);
  }
};

