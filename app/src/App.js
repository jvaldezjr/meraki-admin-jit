// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MyAccessPage from './pages/MyAccessPage';
import RequestAccessPage from './pages/RequestAccessPage';
import ApprovalsPage from './pages/ApprovalsPage';
import SnapshotsPage from './pages/SnapshotsPage';
import ChangeLogPage from './pages/ChangeLogPage';
import AdminPage from './pages/AdminPage';
import { ThemeProvider } from '@magnetic/theme';
import '@magnetic/button/styles.css';
import './App.css';

function App() {
  return (
    <ThemeProvider theme="light-classic">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/my-access" element={<MyAccessPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/snapshots" element={<SnapshotsPage />} />
          <Route path="/change-log" element={<ChangeLogPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
