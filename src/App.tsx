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
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminLinksPage } from './pages/admin/AdminLinksPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

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
        {/* Guest Shortening - Canonical at /shorten, alias at /guest */}
        <Route
          path="/shorten"
          element={
            <PublicLayout>
              <GuestPage />
            </PublicLayout>
          }
        />
        <Route path="/guest" element={<Navigate to="/shorten" replace />} />

        {/* Shared Authentication Routes (/auth/login and /auth/signup) */}
        <Route
          path="/auth/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <PublicLayout>
              <SignupPage />
            </PublicLayout>
          }
        />

        {/* Auth Convenience Aliases */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signin" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/signup" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
        <Route path="/admin/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/admin/signin" element={<Navigate to="/auth/login" replace />} />

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

        {/* Dedicated Admin Portal Routes */}
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminOverviewPage />
            </AdminLayout>
          }
        />
        <Route path="/admin/overview" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin/links"
          element={
            <AdminLayout>
              <AdminLinksPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/security"
          element={
            <AdminLayout>
              <AdminSecurityPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <AdminLayout>
              <AdminActivityPage />
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

        {/* Legacy Admin Subroute Redirects to Unified Hubs */}
        <Route path="/admin/abuse" element={<Navigate to="/admin/security" replace />} />
        <Route path="/admin/blocklist" element={<Navigate to="/admin/security" replace />} />
        <Route path="/admin/destinations" element={<Navigate to="/admin/security" replace />} />
        <Route path="/admin/anomalies" element={<Navigate to="/admin/security" replace />} />
        <Route path="/admin/audit" element={<Navigate to="/admin/activity" replace />} />
        <Route path="/admin/policies" element={<Navigate to="/admin/activity" replace />} />

        {/* Root Short-Link Redirect & 404 Catch-All */}
        <Route path="/:code" element={<RedirectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
