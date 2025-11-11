import { useEffect, useState } from 'react';
import apiClient from '../lib/api/apiClient';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export default function ApiTest() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<HealthStatus>('/health');
        setHealth(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to API');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 border border-gray-200 max-w-sm z-50">
      <div className="flex items-center gap-3 mb-3">
        <Activity className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">API Status</h3>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-indigo-600" />
          <span className="text-sm">Checking connection...</span>
        </div>
      )}

      {!loading && health && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Connected</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Service:</strong> {health.service}</p>
            <p><strong>Version:</strong> {health.version}</p>
            <p><strong>Status:</strong> {health.status}</p>
            <p className="text-xs text-gray-400">{new Date(health.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Connection Failed</span>
          </div>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            Make sure the backend server is running on port 3000
          </p>
        </div>
      )}
    </div>
  );
}
