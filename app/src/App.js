// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@magnetic/theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MyAccessPage from './pages/MyAccessPage';
import RequestAccessPage from './pages/RequestAccessPage';
import ApprovalsPage from './pages/ApprovalsPage';
import SnapshotsPage from './pages/SnapshotsPage';
import ChangeLogPage from './pages/ChangeLogPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import '@magnetic/button/styles.css';
import '@magnetic/table/styles.css';
import './App.css';

function App() {
  return (
    <ThemeProvider theme="light-classic">
      <AuthProvider>
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-access"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyAccessPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-access"
            element={
              <ProtectedRoute>
                <Layout>
                  <RequestAccessPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <Layout>
                  <ApprovalsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/snapshots"
            element={
              <ProtectedRoute>
                <Layout>
                  <SnapshotsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-log"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChangeLogPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminPage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
