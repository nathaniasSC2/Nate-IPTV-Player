/**
 * Setup Page
 * ==========
 * Connection setup page for adding and managing
 * Xtream API connections.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Wifi,
  Server,
  User,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  ChevronRight,
  Tv,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useConnectionStore, selectConnections } from '../stores/connectionStore';
import { Input, PasswordInput, Button, ConfirmModal } from '../components/common';
import type { XtreamConnection } from '../services/xtream/types';

// ============================================
// Types
// ============================================

interface ConnectionFormData {
  name: string;
  serverUrl: string;
  username: string;
  password: string;
}

// ============================================
// Connection Form Component
// ============================================

interface ConnectionFormProps {
  initialData?: Partial<ConnectionFormData>;
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  error,
}) => {
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: initialData?.name || '',
    serverUrl: initialData?.serverUrl || '',
    username: initialData?.username || '',
    password: initialData?.password || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof ConnectionFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const isValid =
    formData.serverUrl.trim() !== '' &&
    formData.username.trim() !== '' &&
    formData.password.trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Server URL */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Server URL
        </label>
        <div className="relative">
          <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <Input
            type="url"
            value={formData.serverUrl}
            onChange={handleChange('serverUrl')}
            placeholder="http://example.com:8080"
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-dark-500 mt-1">
          Enter your IPTV provider's server URL
        </p>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <Input
            type="text"
            value={formData.username}
            onChange={handleChange('username')}
            placeholder="Your username"
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Password
        </label>
        <PasswordInput
          value={formData.password}
          onChange={handleChange('password')}
          placeholder="Your password"
          required
        />
      </div>

      {/* Connection Name (optional) */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Connection Name <span className="text-dark-500">(optional)</span>
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          placeholder="My IPTV Provider"
        />
        <p className="text-xs text-dark-500 mt-1">
          A friendly name to identify this connection
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Connection Failed</p>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              Connect
            </>
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

// ============================================
// Saved Connection Card Component
// ============================================

interface ConnectionCardProps {
  connection: XtreamConnection;
  onConnect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isConnecting: boolean;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onConnect,
  onEdit,
  onDelete,
  isConnecting,
}) => {
  return (
    <div
      className={cn(
        'group p-4 rounded-xl',
        'bg-dark-800 border border-dark-700',
        'hover:border-primary-500/50 transition-all'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            <Server className="w-5 h-5 text-primary-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-white truncate">{connection.name}</h3>
            <p className="text-sm text-dark-400 truncate mt-0.5">
              {connection.username}@{new URL(connection.serverUrl).hostname}
            </p>
            {connection.lastUsed && (
              <p className="text-xs text-dark-500 mt-1">
                Last used: {new Date(connection.lastUsed).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connect Button */}
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className={cn(
          'w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
          'bg-primary-500 text-white font-medium',
          'hover:bg-primary-600 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <ChevronRight className="w-4 h-4" />
            Connect
          </>
        )}
      </button>
    </div>
  );
};

// ============================================
// Main Setup Page Component
// ============================================

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Store
  const connections = useConnectionStore(selectConnections);
  const isConnecting = useConnectionStore((state) => state.isConnecting);
  const connectionError = useConnectionStore((state) => state.error);
  const connect = useConnectionStore((state) => state.connect);
  const saveConnection = useConnectionStore((state) => state.saveConnection);
  const deleteConnection = useConnectionStore((state) => state.deleteConnection);
  const clearError = useConnectionStore((state) => state.clearError);

  // State
  const [showForm, setShowForm] = useState(connections.length === 0);
  const [editingConnection, setEditingConnection] = useState<XtreamConnection | null>(null);
  const [connectionToDelete, setConnectionToDelete] = useState<XtreamConnection | null>(null);

  // Get redirect destination
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/live';

  // Handle new connection
  const handleNewConnection = useCallback(
    async (data: ConnectionFormData) => {
      clearError();
      try {
        await connect({
          serverUrl: data.serverUrl,
          username: data.username,
          password: data.password,
          name: data.name || `${data.username}@${new URL(data.serverUrl).hostname}`,
        });

        // Save connection
        await saveConnection({
          name: data.name || `${data.username}@${new URL(data.serverUrl).hostname}`,
          serverUrl: data.serverUrl,
          username: data.username,
          password: data.password,
        });

        // Navigate to destination
        navigate(from, { replace: true });
      } catch {
        // Error is handled by the store
      }
    },
    [connect, saveConnection, navigate, from, clearError]
  );

  // Handle quick connect to saved connection
  const handleQuickConnect = useCallback(
    async (connection: XtreamConnection) => {
      clearError();
      try {
        await connect(connection);
        navigate(from, { replace: true });
      } catch {
        // Error is handled by the store
      }
    },
    [connect, navigate, from, clearError]
  );

  // Handle edit connection
  const handleEditConnection = useCallback(
    async (data: ConnectionFormData) => {
      if (!editingConnection) return;

      clearError();
      try {
        await connect({
          id: editingConnection.id,
          serverUrl: data.serverUrl,
          username: data.username,
          password: data.password,
          name: data.name || editingConnection.name,
        });

        await saveConnection({
          id: editingConnection.id,
          name: data.name || editingConnection.name,
          serverUrl: data.serverUrl,
          username: data.username,
          password: data.password,
          createdAt: editingConnection.createdAt,
        });

        setEditingConnection(null);
        navigate(from, { replace: true });
      } catch {
        // Error is handled by the store
      }
    },
    [editingConnection, connect, saveConnection, navigate, from, clearError]
  );

  // Handle delete connection
  const handleDeleteConnection = useCallback(async () => {
    if (!connectionToDelete) return;
    await deleteConnection(connectionToDelete.id);
    setConnectionToDelete(null);
  }, [connectionToDelete, deleteConnection]);

  // Handle cancel form
  const handleCancel = useCallback(() => {
    clearError();
    setShowForm(false);
    setEditingConnection(null);
  }, [clearError]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nate IPTV Player</h1>
          <p className="text-dark-400 mt-2">Connect to your IPTV provider</p>
        </div>

        {/* Content */}
        <div className="bg-dark-900 rounded-2xl border border-dark-800 p-6">
          {showForm || editingConnection ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-6">
                {editingConnection ? 'Edit Connection' : 'New Connection'}
              </h2>
              <ConnectionForm
                initialData={
                  editingConnection || undefined
                }
                onSubmit={editingConnection ? handleEditConnection : handleNewConnection}
                onCancel={handleCancel}
                isLoading={isConnecting}
                error={connectionError}
              />
            </>
          ) : (
            <>
              {/* Saved Connections */}
              {connections.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Saved Connections
                  </h2>
                  <div className="space-y-3">
                    {connections.map((connection) => (
                      <ConnectionCard
                        key={connection.id}
                        connection={connection}
                        onConnect={() => handleQuickConnect(connection)}
                        onEdit={() => setEditingConnection(connection)}
                        onDelete={() => setConnectionToDelete(connection)}
                        isConnecting={isConnecting}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Connection Button */}
              <button
                onClick={() => setShowForm(true)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                  'border-2 border-dashed border-dark-700',
                  'text-dark-400 hover:text-white hover:border-primary-500/50',
                  'transition-all'
                )}
              >
                <Plus className="w-5 h-5" />
                Add New Connection
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-dark-500 text-sm mt-6">
          Your credentials are stored locally and never shared.
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={connectionToDelete !== null}
        onClose={() => setConnectionToDelete(null)}
        onConfirm={handleDeleteConnection}
        title="Delete Connection"
        message={`Are you sure you want to delete "${connectionToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SetupPage;
