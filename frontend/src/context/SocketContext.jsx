import { createContext, useContext } from 'react';

/**
 * SocketContext — provides the single shared Socket.IO instance.
 *
 * WHY: StockDetailPage was creating its own socket on every visit,
 * causing duplicate connections, memory leaks, and broken notifications.
 *
 * HOW: App.jsx creates one socket when user logs in and provides it here.
 * Any component that needs the socket uses the useSocket() hook.
 */
export const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);
