/**
 * ConnectionSetup Component
 * Connection wizard for creating and editing Xtream API connections
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Input, PasswordInput } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useConnectionStore } from '@/stores/connectionStore';
import type { XtreamConnection, XtreamAuth } from '@/services/xtream/types';
import {
  Server,
  User,
  KeyRound,
  Tag,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ConnectionSetupProps {
  /** Connection to edit (if editing) */
  connection?: XtreamConnection | null;
  /** Callback when connection is saved */
  onSave?: (connection: XtreamConnection) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Additional class name */
  className?: string;
}

interface FormState {
  name: string;
  serverUrl: string;
  username: string;
  password: string;
}

interface FormErrors {
  name?: string;
  serverUrl?: string;
  username?: string;
  password?: string;
}

interface TestResult {
  success: boolean;
  message: string;
  authInfo?: XtreamAuth;
}

// ============================================================================
// Validation
// ============================================================================

function validateUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Connection name is required';
  }

  if (!form.serverUrl.trim()) {
    errors.serverUrl = 'Server URL is required';
  } else if (!validateUrl(form.serverUrl.trim())) {
    errors.serverUrl = 'URL must start with http:// or https://';
  }

  if (!form.username.trim()) {
    errors.username = 'Username is required';
  }

  if (!form.password.trim()) {
    errors.password = 'Password is required';
  }

  return errors;
}

// ============================================================================
// Component
// ============================================================================

export function ConnectionSetup({
  connection,
  onSave,
  onCancel,
  className,
}: ConnectionSetupProps) {
  const { connect, saveConnection, isConnecting } = useConnectionStore();

  // Form state
  const [form, setForm] = useState<FormState>({
    name: '',
    serverUrl: '',
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Determine if editing
  const isEditing = !!connection;

  // Initialize form when connection changes
  useEffect(() => {
    if (connection) {
      setForm({
        name: connection.name,
        serverUrl: connection.serverUrl,
        username: connection.username,
        password: connection.password,
      });
      setTestResult(null);
      setTouched({});
      setErrors({});
    } else {
      // Reset form for new connection
      setForm({
        name: '',
        serverUrl: '',
        username: '',
        password: '',
      });
      setTestResult(null);
      setTouched({});
      setErrors({});
    }
  }, [connection]);

  // Handle input change
  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));

      // Clear test result when form changes
      if (testResult) {
        setTestResult(null);
      }

      // Validate on change if field was touched
      if (touched[field]) {
        const newErrors = validateForm({ ...form, [field]: value });
        setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
      }
    },
    [form, touched, testResult]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (field: keyof FormState) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const newErrors = validateForm(form);
      setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
    },
    [form]
  );

  // Auto-generate name from URL and username
  const generateConnectionName = useCallback(() => {
    if (form.serverUrl && form.username && !form.name) {
      try {
        const url = new URL(form.serverUrl);
        const autoName = `${form.username}@${url.hostname}`;
        setForm((prev) => ({ ...prev, name: autoName }));
      } catch {
        // Invalid URL, don't auto-generate
      }
    }
  }, [form.serverUrl, form.username, form.name]);

  // Test connection
  const handleTestConnection = async () => {
    // Validate all fields
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setTouched({ name: true, serverUrl: true, username: true, password: true });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const authInfo = await connect({
        serverUrl: form.serverUrl.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
      });

      setTestResult({
        success: true,
        message: `Connected successfully! Account status: ${authInfo.user_info.status}`,
        authInfo,
      });

      // Auto-generate name if empty
      generateConnectionName();
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save connection
  const handleSave = async () => {
    // Validate all fields
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setTouched({ name: true, serverUrl: true, username: true, password: true });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const savedConnection = await saveConnection({
        id: connection?.id,
        name: form.name.trim(),
        serverUrl: form.serverUrl.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        createdAt: connection?.createdAt,
        lastUsed: connection?.lastUsed,
      });

      onSave?.(savedConnection);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save connection',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if form is valid
  const isFormValid = Object.keys(validateForm(form)).length === 0;
  const canSave = isFormValid && (testResult?.success || isEditing);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="border-b border-dark-700 pb-4">
        <h3 className="text-lg font-semibold text-white">
          {isEditing ? 'Edit Connection' : 'New Connection'}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {isEditing
            ? 'Update your Xtream API connection details'
            : 'Enter your Xtream API credentials to connect'}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Connection Name */}
        <Input
          label="Connection Name"
          placeholder="My IPTV Server"
          value={form.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          error={touched.name ? errors.name : undefined}
          leftIcon={<Tag className="w-4 h-4" />}
          fullWidth
          helperText="A friendly name to identify this connection"
        />

        {/* Server URL */}
        <Input
          label="Server URL"
          placeholder="http://example.com:8080"
          value={form.serverUrl}
          onChange={handleChange('serverUrl')}
          onBlur={handleBlur('serverUrl')}
          error={touched.serverUrl ? errors.serverUrl : undefined}
          leftIcon={<Server className="w-4 h-4" />}
          fullWidth
          helperText="Must start with http:// or https://"
        />

        {/* Username */}
        <Input
          label="Username"
          placeholder="Enter username"
          value={form.username}
          onChange={handleChange('username')}
          onBlur={handleBlur('username')}
          error={touched.username ? errors.username : undefined}
          leftIcon={<User className="w-4 h-4" />}
          fullWidth
          autoComplete="username"
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange('password')}
          onBlur={handleBlur('password')}
          error={touched.password ? errors.password : undefined}
          leftIcon={<KeyRound className="w-4 h-4" />}
          fullWidth
          autoComplete="current-password"
        />
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg',
            testResult.success
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          )}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium',
                testResult.success ? 'text-green-400' : 'text-red-400'
              )}
            >
              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
            </p>
            <p className="text-sm text-gray-400 mt-1">{testResult.message}</p>
            {testResult.authInfo && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="success" size="sm">
                  {testResult.authInfo.user_info.status}
                </Badge>
                {testResult.authInfo.user_info.is_trial === '1' && (
                  <Badge variant="warning" size="sm">
                    Trial
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-dark-700">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isTesting || isSaving}>
            Cancel
          </Button>
        )}

        <div className="flex-1" />

        <Button
          variant="outline"
          onClick={handleTestConnection}
          isLoading={isTesting || isConnecting}
          loadingText="Testing..."
          leftIcon={<RefreshCw className="w-4 h-4" />}
          disabled={!isFormValid || isSaving}
        >
          Test Connection
        </Button>

        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          loadingText="Saving..."
          leftIcon={<Save className="w-4 h-4" />}
          disabled={!canSave || isTesting}
        >
          {isEditing ? 'Save Changes' : 'Save Connection'}
        </Button>
      </div>

      {/* Help Text */}
      {!testResult && !isEditing && (
        <p className="text-xs text-gray-500 text-center">
          Test your connection before saving to verify the credentials are correct.
        </p>
      )}
    </div>
  );
}

export default ConnectionSetup;
