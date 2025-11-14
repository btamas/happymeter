import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FeedbackForm from './pages/FeedbackForm';

const Admin = lazy(() => import('./pages/Admin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<FeedbackForm />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
