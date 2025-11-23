/**
 * ConnectionList Component
 * Displays and manages saved Xtream API connections
 */

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button, IconButton } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmModal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/LoadingStates';
import { useConnectionStore, selectAccountInfo } from '@/stores/connectionStore';
import type { XtreamConnection } from '@/services/xtream/types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Server,
  Plus,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ConnectionListProps {
  /** Callback when "Add New" is clicked */
  onAddNew?: () => void;
  /** Callback when a connection is selected for editing */
  onEdit?: (connection: XtreamConnection) => void;
  /** Callback when a connection is selected to connect */
  onConnect?: (connection: XtreamConnection) => void;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Connection Card Component
// ============================================================================

interface ConnectionCardProps {
  connection: XtreamConnection;
  isActive: boolean;
  isConnecting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onConnect: () => void;
}

function ConnectionCard({
  connection,
  isActive,
  isConnecting,
  onEdit,
  onDelete,
  onConnect,
}: ConnectionCardProps) {
  const accountInfo = useConnectionStore(selectAccountInfo);

  // Parse server hostname
  let hostname = 'Unknown Server';
  try {
    const url = new URL(connection.serverUrl);
    hostname = url.hostname;
  } catch {
    hostname = connection.serverUrl;
  }

  // Format last used
  const lastUsedText = connection.lastUsed
    ? formatDistanceToNow(connection.lastUsed, { addSuffix: true })
    : 'Never used';

  // Format created date
  const createdText = format(connection.createdAt, 'MMM d, yyyy');

  // Determine account status for this connection
  const getAccountStatus = () => {
    if (!isActive || !accountInfo) {
      return { status: 'unknown', label: 'Unknown', variant: 'default' as const };
    }

    if (accountInfo.status === 'Active') {
      return { status: 'active', label: 'Active', variant: 'success' as const };
    } else if (accountInfo.status === 'Expired') {
      return { status: 'expired', label: 'Expired', variant: 'danger' as const };
    } else if (accountInfo.isTrial) {
      return { status: 'trial', label: 'Trial', variant: 'warning' as const };
    }

    return { status: 'unknown', label: accountInfo.status, variant: 'default' as const };
  };

  const statusInfo = getAccountStatus();

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border transition-all duration-200',
        isActive
          ? 'bg-primary-600/10 border-primary-500/50'
          : 'bg-dark-800 border-dark-700 hover:border-dark-600'
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-3 right-3">
          <Badge variant="success" size="xs" dot>
            Connected
          </Badge>
        </div>
      )}

      {/* Connection Info */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-lg',
            isActive ? 'bg-primary-600/20' : 'bg-dark-700'
          )}
        >
          {isActive ? (
            <Wifi className={cn('w-6 h-6', isActive ? 'text-primary-400' : 'text-gray-400')} />
          ) : (
            <Server className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-medium text-white truncate pr-20">
            {connection.name}
          </h4>
          <p className="text-sm text-gray-400 truncate mt-0.5">{hostname}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUsedText}
            </span>
            <span>Created {createdText}</span>
          </div>

          {/* Status Badge - Only show for active connection */}
          {isActive && (
            <div className="mt-2">
              <Badge variant={statusInfo.variant} size="sm">
                {statusInfo.label}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-700">
        {!isActive ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onConnect}
            isLoading={isConnecting}
            loadingText="Connecting..."
            leftIcon={<Wifi className="w-4 h-4" />}
          >
            Connect
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onConnect}
            leftIcon={<WifiOff className="w-4 h-4" />}
          >
            Disconnect
          </Button>
        )}

        <div className="flex-1" />

        <IconButton
          variant="ghost"
          size="sm"
          icon={<Edit2 className="w-4 h-4" />}
          aria-label="Edit connection"
          onClick={onEdit}
        />
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Trash2 className="w-4 h-4" />}
          aria-label="Delete connection"
          onClick={onDelete}
          className="hover:text-red-400"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ onAddNew }: { onAddNew?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mb-4">
        <Server className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No Connections</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">
        Add your first Xtream API connection to start watching live TV, movies, and series.
      </p>
      {onAddNew && (
        <Button variant="primary" onClick={onAddNew} leftIcon={<Plus className="w-4 h-4" />}>
          Add Connection
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConnectionList({
  onAddNew,
  onEdit,
  onConnect,
  className,
}: ConnectionListProps) {
  const {
    connections,
    activeConnection,
    isLoading,
    isConnecting,
    error,
    loadConnections,
    connect,
    disconnect,
    deleteConnection,
    clearError,
  } = useConnectionStore();

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<XtreamConnection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Handle connect/disconnect
  const handleConnect = async (connection: XtreamConnection) => {
    if (activeConnection?.id === connection.id) {
      disconnect();
    } else {
      try {
        await connect(connection);
        onConnect?.(connection);
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    }
  };

  // Handle delete
  const handleDeleteClick = (connection: XtreamConnection) => {
    setDeleteTarget(connection);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteConnection(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  // Loading state
  if (isLoading && connections.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (connections.length === 0) {
    return (
      <div className={className}>
        <EmptyState onAddNew={onAddNew} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Saved Connections</h3>
          <p className="text-sm text-gray-400">
            {connections.length} connection{connections.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onAddNew && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAddNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Connection List */}
      <div className="space-y-3">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            isActive={activeConnection?.id === connection.id}
            isConnecting={isConnecting && activeConnection?.id !== connection.id}
            onEdit={() => onEdit?.(connection)}
            onDelete={() => handleDeleteClick(connection)}
            onConnect={() => handleConnect(connection)}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Connection"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ConnectionList;
