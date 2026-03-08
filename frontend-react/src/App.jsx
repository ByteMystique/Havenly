import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import AiChat from './components/AiChat';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HostelsPage = lazy(() => import('./pages/HostelsPage'));
const HostelDetailPage = lazy(() => import('./pages/HostelDetailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<Loader text="Loading page..." />}>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route
                path="/hostels"
                element={
                  <ProtectedRoute>
                    <HostelsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hostel/:id"
                element={
                  <ProtectedRoute>
                    <HostelDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compare"
                element={
                  <ProtectedRoute>
                    <ComparePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <AiChat />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
