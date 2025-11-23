/**
 * Connection Store
 * Manages Xtream API connections and authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { XtreamConnection, XtreamAuth } from '../services/xtream/types';
import {
  authenticate,
  getConnections,
  saveConnection as saveConnectionToStorage,
  deleteConnection as deleteConnectionFromStorage,
} from '../services/xtream/client';

// ============================================
// Types
// ============================================

interface ConnectionState {
  // Data
  connections: XtreamConnection[];
  activeConnection: XtreamConnection | null;
  authInfo: XtreamAuth | null;

  // Loading & Error States
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConnections: () => Promise<void>;
  connect: (connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'> & Partial<XtreamConnection>) => Promise<XtreamAuth>;
  disconnect: () => void;
  saveConnection: (connection: Omit<XtreamConnection, 'id' | 'createdAt'> & Partial<Pick<XtreamConnection, 'id' | 'createdAt'>>) => Promise<XtreamConnection>;
  deleteConnection: (connectionId: string) => Promise<void>;
  setActiveConnection: (connection: XtreamConnection | null) => void;
  updateConnectionLastUsed: (connectionId: string) => void;
  clearError: () => void;
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// Store
// ============================================

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      // Initial State
      connections: [],
      activeConnection: null,
      authInfo: null,
      isConnecting: false,
      isLoading: false,
      error: null,

      // Load connections from storage
      loadConnections: async () => {
        set({ isLoading: true, error: null });
        try {
          const connections = await getConnections();
          set({ connections, isLoading: false });
        } catch (error) {
          console.error('[ConnectionStore] Failed to load connections:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load connections',
          });
        }
      },

      // Connect to an Xtream server
      connect: async (connection) => {
        set({ isConnecting: true, error: null });

        try {
          // Authenticate with the server
          const authInfo = await authenticate({
            serverUrl: connection.serverUrl,
            username: connection.username,
            password: connection.password,
          });

          // Check if authentication was successful
          if (authInfo.user_info.auth !== 1) {
            throw new Error('Authentication failed: Invalid credentials');
          }

          // Check account status
          if (authInfo.user_info.status !== 'Active') {
            throw new Error(`Account is not active: ${authInfo.user_info.status}`);
          }

          // Find or create the connection object
          let activeConn: XtreamConnection;
          const existingConn = get().connections.find(
            (c) =>
              c.serverUrl === connection.serverUrl &&
              c.username === connection.username
          );

          if (existingConn) {
            activeConn = { ...existingConn, lastUsed: Date.now() };
          } else {
            activeConn = {
              id: connection.id || generateId(),
              name: connection.name || `${connection.username}@${new URL(connection.serverUrl).hostname}`,
              serverUrl: connection.serverUrl,
              username: connection.username,
              password: connection.password,
              createdAt: connection.createdAt || Date.now(),
              lastUsed: Date.now(),
            };
          }

          set({
            authInfo,
            activeConnection: activeConn,
            isConnecting: false,
            error: null,
          });

          return authInfo;
        } catch (error) {
          console.error('[ConnectionStore] Connection failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Connection failed';
          set({
            isConnecting: false,
            error: errorMessage,
            authInfo: null,
            activeConnection: null,
          });
          throw error;
        }
      },

      // Disconnect from current server
      disconnect: () => {
        set({
          activeConnection: null,
          authInfo: null,
          error: null,
        });
      },

      // Save a new connection
      saveConnection: async (connectionData) => {
        const { connections } = get();

        // Check for duplicate
        const existingIndex = connections.findIndex(
          (c) =>
            c.serverUrl === connectionData.serverUrl &&
            c.username === connectionData.username
        );

        const connection: XtreamConnection = {
          id: connectionData.id || generateId(),
          name: connectionData.name,
          serverUrl: connectionData.serverUrl,
          username: connectionData.username,
          password: connectionData.password,
          createdAt: connectionData.createdAt || Date.now(),
          lastUsed: connectionData.lastUsed,
        };

        let updatedConnections: XtreamConnection[];

        if (existingIndex >= 0) {
          // Update existing connection
          updatedConnections = [...connections];
          updatedConnections[existingIndex] = {
            ...updatedConnections[existingIndex],
            ...connection,
            id: connections[existingIndex].id, // Preserve original ID
            createdAt: connections[existingIndex].createdAt, // Preserve creation time
          };
        } else {
          // Add new connection
          updatedConnections = [...connections, connection];
        }

        // Persist to backend storage
        try {
          await saveConnectionToStorage(connection);
        } catch (error) {
          console.error('[ConnectionStore] Failed to persist connection:', error);
          // Continue anyway - local state will be persisted via zustand
        }

        set({ connections: updatedConnections });

        return connection;
      },

      // Delete a connection
      deleteConnection: async (connectionId) => {
        const { connections, activeConnection } = get();

        // Remove from backend storage
        try {
          await deleteConnectionFromStorage(connectionId);
        } catch (error) {
          console.error('[ConnectionStore] Failed to delete connection from storage:', error);
        }

        // Remove from local state
        const updatedConnections = connections.filter((c) => c.id !== connectionId);

        set({
          connections: updatedConnections,
          // Clear active connection if it was deleted
          activeConnection:
            activeConnection?.id === connectionId ? null : activeConnection,
          authInfo: activeConnection?.id === connectionId ? null : get().authInfo,
        });
      },

      // Set active connection without authenticating
      setActiveConnection: (connection) => {
        set({ activeConnection: connection });
      },

      // Update last used timestamp
      updateConnectionLastUsed: (connectionId) => {
        const { connections } = get();
        const updatedConnections = connections.map((c) =>
          c.id === connectionId ? { ...c, lastUsed: Date.now() } : c
        );
        set({ connections: updatedConnections });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'nate-iptv-connections',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connections: state.connections,
        // Don't persist auth info or active connection for security
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectConnections = (state: ConnectionState) => state.connections;
export const selectActiveConnection = (state: ConnectionState) => state.activeConnection;
export const selectAuthInfo = (state: ConnectionState) => state.authInfo;
export const selectIsConnecting = (state: ConnectionState) => state.isConnecting;
export const selectConnectionError = (state: ConnectionState) => state.error;

export const selectIsConnected = (state: ConnectionState) =>
  state.activeConnection !== null && state.authInfo !== null;

export const selectAccountInfo = (state: ConnectionState) => {
  if (!state.authInfo) return null;

  const { user_info } = state.authInfo;
  const expDate = user_info.exp_date
    ? new Date(parseInt(user_info.exp_date) * 1000)
    : null;

  return {
    username: user_info.username,
    status: user_info.status,
    expirationDate: expDate,
    isTrial: user_info.is_trial === '1',
    maxConnections: parseInt(user_info.max_connections) || 1,
    activeConnections: parseInt(user_info.active_cons) || 0,
    allowedFormats: user_info.allowed_output_formats,
  };
};
