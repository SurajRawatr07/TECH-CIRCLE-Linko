import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { GuestPage } from './pages/GuestPage';
import { RedirectPage } from './pages/RedirectPage';
import { PublicBioPage } from './pages/PublicBioPage';
import { NotFoundPage } from './pages/NotFoundPage';

// User App Pages
import { DashboardPage } from './pages/DashboardPage';
import { LinksListPage } from './pages/LinksListPage';
import { CreateLinkPage } from './pages/CreateLinkPage';
import { LinkDetailsPage } from './pages/LinkDetailsPage';
import { BulkImportPage } from './pages/BulkImportPage';
import { QrCenterPage } from './pages/QrCenterPage';
import { BioBuilderPage } from './pages/BioBuilderPage';
import { PolicyLabPage } from './pages/PolicyLabPage';
import { LifecyclePage } from './pages/LifecyclePage';
import { TrustCenterPage } from './pages/TrustCenterPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { TagsPage } from './pages/TagsPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminLinksPage } from './pages/admin/AdminLinksPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAbusePage } from './pages/admin/AdminAbusePage';
import { AdminBlocklistPage } from './pages/admin/AdminBlocklistPage';
import { AdminDestinationAlertsPage } from './pages/admin/AdminDestinationAlertsPage';
import { AdminAnomaliesPage } from './pages/admin/AdminAnomaliesPage';
import { AdminAuditLogPage } from './pages/admin/AdminAuditLogPage';
import { AdminPoliciesPage } from './pages/admin/AdminPoliciesPage';

export default function App() {
  const { init: initAuth } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <LandingPage />
            </PublicLayout>
          }
        />
        <Route
          path="/guest"
          element={
            <PublicLayout>
              <GuestPage />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/register"
          element={
            <PublicLayout>
              <SignupPage />
            </PublicLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicLayout>
              <SignupPage />
            </PublicLayout>
          }
        />
        <Route
          path="/admin/login"
          element={
            <PublicLayout>
              <AdminLoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/admin/signin"
          element={
            <PublicLayout>
              <AdminLoginPage />
            </PublicLayout>
          }
        />

        {/* Public Redirect & Bio Pages */}
        <Route path="/r/:code" element={<RedirectPage />} />
        <Route path="/bio/:slug" element={<PublicBioPage />} />
        <Route path="/b/:slug" element={<PublicBioPage />} />

        {/* Top-Level Aliases */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/links" element={<Navigate to="/app/links" replace />} />
        <Route path="/lifecycle" element={<Navigate to="/app/lifecycle" replace />} />

        {/* User App Routes */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route
          path="/app/dashboard"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links"
          element={
            <AppLayout>
              <LinksListPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links/new"
          element={
            <AppLayout>
              <CreateLinkPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links/import"
          element={
            <AppLayout>
              <BulkImportPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links/:id"
          element={
            <AppLayout>
              <LinkDetailsPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/qr"
          element={
            <AppLayout>
              <QrCenterPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/bio"
          element={
            <AppLayout>
              <BioBuilderPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/policy-lab"
          element={
            <AppLayout>
              <PolicyLabPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/lifecycle"
          element={
            <AppLayout>
              <LifecyclePage />
            </AppLayout>
          }
        />
        <Route
          path="/app/trust-center"
          element={
            <AppLayout>
              <TrustCenterPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/campaigns"
          element={
            <AppLayout>
              <CampaignsPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/tags"
          element={
            <AppLayout>
              <TagsPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/settings"
          element={
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          }
        />

        {/* Admin Routes - Rendered within Dedicated AdminLayout */}
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        <Route
          path="/admin/overview"
          element={
            <AdminLayout>
              <AdminOverviewPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/links"
          element={
            <AdminLayout>
              <AdminLinksPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminLayout>
              <AdminUsersPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/abuse"
          element={
            <AdminLayout>
              <AdminAbusePage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/blocklist"
          element={
            <AdminLayout>
              <AdminBlocklistPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/destinations"
          element={
            <AdminLayout>
              <AdminDestinationAlertsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/anomalies"
          element={
            <AdminLayout>
              <AdminAnomaliesPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <AdminLayout>
              <AdminAuditLogPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/policies"
          element={
            <AdminLayout>
              <AdminPoliciesPage />
            </AdminLayout>
          }
        />

        {/* Root Short-Link Redirect & 404 Catch-All */}
        <Route path="/:code" element={<RedirectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
