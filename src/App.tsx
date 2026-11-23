import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, RoleAwareLayout, StudentLayout } from './components/Layouts';
import { RedirectIfAuth, RequireAdmin, RequireAuth } from './components/RouteGuards';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminManageComplaintPage from './pages/AdminManageComplaintPage';
import AdminTechniciansPage from './pages/AdminTechniciansPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ProfilePage from './pages/ProfilePage';
import ReportPage from './pages/ReportPage';
import SignupPage from './pages/SignupPage';
import WelcomePage from './pages/WelcomePage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route
              path="/login"
              element={
                <RedirectIfAuth>
                  <LoginPage />
                </RedirectIfAuth>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfAuth>
                  <SignupPage />
                </RedirectIfAuth>
              }
            />

            {/* Student / Citizen routes */}
            <Route
              element={
                <RequireAuth>
                  <StudentLayout />
                </RequireAuth>
              }
            >
              <Route path="/report" element={<ReportPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/my" element={<MyComplaintsPage />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
            </Route>

            {/* Shared Profile route adapting to Student or Admin shell */}
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <RoleAwareLayout>
                    <ProfilePage />
                  </RoleAwareLayout>
                </RequireAuth>
              }
            />

            {/* Admin routes (normal users redirected away to /feed) */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="complaints/:id" element={<AdminManageComplaintPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="technicians" element={<AdminTechniciansPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
