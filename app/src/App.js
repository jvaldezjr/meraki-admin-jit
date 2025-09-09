// src/App.js
import React from 'react';
import Layout from './components/Layout'; // Import your new Layout component
import HomePage from './pages/HomePage';   // Import your example Home Page
import { ThemeProvider } from '@magnetic/theme'; // NEW: Import ThemeProvider

// Only global styles or styles not specific to Layout/Pages should be here.
// For now, keep button styles here as HomePage uses it.
import '@magnetic/button/styles.css';
import './App.css';

function App() {
  return (
    <ThemeProvider theme="light-classic">
      <Layout>
        <HomePage />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
