import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const { user } = useAuth();

  // Create an in-memory event emitter that safely handles real-time simulation
  const [socket] = useState(() => {
    const listeners = new Map();
    return {
      on: (event, callback) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(callback);
      },
      off: (event, callback) => {
        if (listeners.has(event)) {
          listeners.get(event).delete(callback);
        }
      },
      emit: (event, ...args) => {
        if (listeners.has(event)) {
          listeners.get(event).forEach((cb) => {
            try {
              cb(...args);
            } catch (e) {
              console.warn('Socket listener error:', e);
            }
          });
        }
      },
      connected: true,
      disconnect: () => {},
    };
  });

  return (
    <SocketContext.Provider value={{ socket, isConnected: true }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || { socket: null, isConnected: false };
};
