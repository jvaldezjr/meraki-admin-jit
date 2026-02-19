// AFTER (React 17 style)

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ResizeObserver "loop" errors are benign. Run the callback in rAF to avoid the loop; also suppress if it still fires.
(function () {
  const NativeResizeObserver = window.ResizeObserver;
  if (!NativeResizeObserver) return;
  window.ResizeObserver = function (callback) {
    return new NativeResizeObserver(function (entries, observer) {
      requestAnimationFrame(() => {
        try {
          callback(entries, observer);
        } catch (_) {}
      });
    });
  };
})();
window.addEventListener('error', function (e) {
  if (e.message && (e.message.includes('ResizeObserver loop') || e.message.includes('ResizeObserver loop limit exceeded'))) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
}, true);
const origOnError = window.onerror;
window.onerror = function (message, ...args) {
  if (typeof message === 'string' && message.includes('ResizeObserver loop')) return true;
  return origOnError ? origOnError.apply(this, [message, ...args]) : false;
};

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you're using reportWebVitals, keep it
reportWebVitals();