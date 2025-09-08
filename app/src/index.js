// AFTER (React 17 style)
import React from 'react';
import ReactDOM from 'react-dom'; // Change this import
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render( // Change this line
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // And add the target element here
);

// If you're using reportWebVitals, keep it
reportWebVitals();