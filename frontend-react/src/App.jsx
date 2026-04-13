import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerRoute from './components/OwnerRoute';
import Loader from './components/Loader';
import AiChat from './components/AiChat';

// Lazy-loaded pages
const HomePage         = lazy(() => import('./pages/HomePage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const HostelsPage      = lazy(() => import('./pages/HostelsPage'));
const HostelDetailPage = lazy(() => import('./pages/HostelDetailPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const ComparePage      = lazy(() => import('./pages/ComparePage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));

// Owner pages
const OwnerDashboardPage = lazy(() => import('./pages/owner/OwnerDashboardPage'));
const OwnerHostelsPage   = lazy(() => import('./pages/owner/OwnerHostelsPage'));
const HostelFormPage     = lazy(() => import('./pages/owner/HostelFormPage'));
const OwnerBookingsPage  = lazy(() => import('./pages/owner/OwnerBookingsPage'));

// Show AI chat for logged-in students only
function StudentAiChat() {
  const { isLoggedIn, isOwner } = useAuth();
  if (!isLoggedIn || isOwner) return null;
  return <AiChat />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <Suspense fallback={<Loader text="Loading..." />}>
              <Routes>
                {/* Public */}
                <Route path="/"       element={<HomePage />} />
                <Route path="/login"  element={<LoginPage />} />

                {/* Student routes */}
                <Route path="/hostels"    element={<ProtectedRoute><HostelsPage /></ProtectedRoute>} />
                <Route path="/hostel/:id" element={<ProtectedRoute><HostelDetailPage /></ProtectedRoute>} />
                <Route path="/compare"    element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
                <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* Owner routes */}
                <Route path="/owner/dashboard"        element={<OwnerRoute><OwnerDashboardPage /></OwnerRoute>} />
                <Route path="/owner/hostels"           element={<OwnerRoute><OwnerHostelsPage /></OwnerRoute>} />
                <Route path="/owner/hostels/new"       element={<OwnerRoute><HostelFormPage /></OwnerRoute>} />
                <Route path="/owner/hostels/:id/edit"  element={<OwnerRoute><HostelFormPage /></OwnerRoute>} />
                <Route path="/owner/bookings"          element={<OwnerRoute><OwnerBookingsPage /></OwnerRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <StudentAiChat />
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
