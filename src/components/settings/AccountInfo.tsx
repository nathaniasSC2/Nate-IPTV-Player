/**
 * AccountInfo Component
 * Displays current account details and server information
 */

import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/common/Badge';
import { useConnectionStore, selectAccountInfo, selectAuthInfo } from '@/stores/connectionStore';
import {
  format,
  formatDistanceToNow,
  differenceInDays,
  differenceInHours,
  isPast,
} from 'date-fns';
import {
  User,
  Calendar,
  Clock,
  Server,
  Globe,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface AccountInfoProps {
  /** Additional class name */
  className?: string;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

// ============================================================================
// Info Row Component
// ============================================================================

function InfoRow({ icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-3', className)}>
      <div className="flex items-center gap-3">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-sm text-white font-medium">{value}</div>
    </div>
  );
}

// ============================================================================
// Section Component
// ============================================================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Section({ title, icon, children, className }: SectionProps) {
  return (
    <div className={cn('rounded-lg bg-dark-800 border border-dark-700 overflow-hidden', className)}>
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-900/50 border-b border-dark-700">
        <span className="text-primary-400">{icon}</span>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <div className="px-4 divide-y divide-dark-700">{children}</div>
    </div>
  );
}

// ============================================================================
// Expiration Countdown Component
// ============================================================================

interface ExpirationCountdownProps {
  expirationDate: Date;
}

function ExpirationCountdown({ expirationDate }: ExpirationCountdownProps) {
  const isExpired = isPast(expirationDate);
  const daysRemaining = differenceInDays(expirationDate, new Date());
  const hoursRemaining = differenceInHours(expirationDate, new Date());

  if (isExpired) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="danger" size="sm">
          Expired
        </Badge>
        <span className="text-sm text-red-400">
          {formatDistanceToNow(expirationDate, { addSuffix: true })}
        </span>
      </div>
    );
  }

  // Warning colors based on time remaining
  let variant: 'success' | 'warning' | 'danger' = 'success';
  if (daysRemaining <= 3) {
    variant = 'danger';
  } else if (daysRemaining <= 7) {
    variant = 'warning';
  }

  // Format countdown
  let countdownText = '';
  if (daysRemaining > 0) {
    countdownText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
  } else if (hoursRemaining > 0) {
    countdownText = `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} remaining`;
  } else {
    countdownText = 'Expiring soon';
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-sm text-white">{format(expirationDate, 'MMM d, yyyy')}</span>
      <Badge variant={variant} size="xs">
        {countdownText}
      </Badge>
    </div>
  );
}

// ============================================================================
// No Connection State
// ============================================================================

function NoConnectionState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mb-4">
        <User className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No Active Connection</h3>
      <p className="text-sm text-gray-400 max-w-sm">
        Connect to an Xtream API server to view your account details and subscription information.
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AccountInfo({ className }: AccountInfoProps) {
  const accountInfo = useConnectionStore(selectAccountInfo);
  const authInfo = useConnectionStore(selectAuthInfo);
  const activeConnection = useConnectionStore((state) => state.activeConnection);

  // Derive status badge
  const statusBadge = useMemo(() => {
    if (!accountInfo) return null;

    if (accountInfo.status === 'Active') {
      if (accountInfo.isTrial) {
        return (
          <Badge variant="warning" size="sm">
            <Zap className="w-3 h-3 mr-1" />
            Trial
          </Badge>
        );
      }
      return (
        <Badge variant="success" size="sm">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (accountInfo.status === 'Expired') {
      return (
        <Badge variant="danger" size="sm">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="default" size="sm">
        {accountInfo.status}
      </Badge>
    );
  }, [accountInfo]);

  // No connection state
  if (!activeConnection || !authInfo || !accountInfo) {
    return (
      <div className={className}>
        <NoConnectionState />
      </div>
    );
  }

  // Parse server info
  const serverInfo = authInfo.server_info;
  let serverHostname = 'Unknown';
  try {
    const url = new URL(activeConnection.serverUrl);
    serverHostname = url.hostname;
  } catch {
    serverHostname = activeConnection.serverUrl;
  }

  // Parse created date
  const createdDate = authInfo.user_info.created_at
    ? new Date(parseInt(authInfo.user_info.created_at) * 1000)
    : null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Account Overview Card */}
      <div className="rounded-lg bg-gradient-to-br from-primary-600/20 to-dark-800 border border-primary-500/20 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-600/20 flex items-center justify-center">
              <User className="w-7 h-7 text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{accountInfo.username}</h3>
              <p className="text-sm text-gray-400 mt-1">{activeConnection.name}</p>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{accountInfo.maxConnections}</div>
            <div className="text-xs text-gray-400 mt-1">Max Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{accountInfo.activeConnections}</div>
            <div className="text-xs text-gray-400 mt-1">Active Now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {accountInfo.allowedFormats?.length || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">Formats</div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <Section title="Account Details" icon={<Shield className="w-4 h-4" />}>
        <InfoRow
          icon={<User className="w-4 h-4" />}
          label="Username"
          value={accountInfo.username}
        />
        <InfoRow
          icon={<Activity className="w-4 h-4" />}
          label="Account Status"
          value={statusBadge}
        />
        {accountInfo.expirationDate && (
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Expiration Date"
            value={<ExpirationCountdown expirationDate={accountInfo.expirationDate} />}
          />
        )}
        <InfoRow
          icon={<Users className="w-4 h-4" />}
          label="Max Connections"
          value={accountInfo.maxConnections}
        />
        <InfoRow
          icon={<Zap className="w-4 h-4" />}
          label="Active Connections"
          value={
            <span
              className={cn(
                accountInfo.activeConnections >= accountInfo.maxConnections
                  ? 'text-yellow-400'
                  : 'text-white'
              )}
            >
              {accountInfo.activeConnections} / {accountInfo.maxConnections}
            </span>
          }
        />
        {createdDate && (
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Account Created"
            value={format(createdDate, 'MMM d, yyyy')}
          />
        )}
      </Section>

      {/* Server Information */}
      <Section title="Server Information" icon={<Server className="w-4 h-4" />}>
        <InfoRow icon={<Server className="w-4 h-4" />} label="Server" value={serverHostname} />
        <InfoRow
          icon={<Globe className="w-4 h-4" />}
          label="Server URL"
          value={
            <span className="max-w-[200px] truncate block" title={activeConnection.serverUrl}>
              {activeConnection.serverUrl}
            </span>
          }
        />
        {serverInfo.timezone && (
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Timezone"
            value={serverInfo.timezone}
          />
        )}
        {serverInfo.time_now && (
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Server Time"
            value={serverInfo.time_now}
          />
        )}
        {serverInfo.port && (
          <InfoRow icon={<Activity className="w-4 h-4" />} label="Port" value={serverInfo.port} />
        )}
        {serverInfo.https_port && (
          <InfoRow
            icon={<Shield className="w-4 h-4" />}
            label="HTTPS Port"
            value={serverInfo.https_port}
          />
        )}
      </Section>

      {/* Supported Formats */}
      {accountInfo.allowedFormats && accountInfo.allowedFormats.length > 0 && (
        <Section title="Supported Formats" icon={<Activity className="w-4 h-4" />}>
          <div className="py-3">
            <div className="flex flex-wrap gap-2">
              {accountInfo.allowedFormats.map((format) => (
                <Badge key={format} variant="secondary" size="sm">
                  {format.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Warning for expiring soon */}
      {accountInfo.expirationDate && differenceInDays(accountInfo.expirationDate, new Date()) <= 7 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Subscription Expiring Soon</p>
            <p className="text-sm text-gray-400 mt-1">
              Your subscription will expire{' '}
              {formatDistanceToNow(accountInfo.expirationDate, { addSuffix: true })}. Please renew
              to continue using the service.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountInfo;
