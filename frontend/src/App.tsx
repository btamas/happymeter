import { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">HappyMeter</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Backend Health Check</h2>
          {loading && <p className="text-gray-600">Checking backend...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {health && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">✓ Status: {health.status}</p>
              <p className="text-gray-600">Timestamp: {new Date(health.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
