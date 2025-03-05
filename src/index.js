import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

// Add global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
};

// Add promise rejection handler
window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
};

// Add a global function to trigger caching of all resources
// This can be called from the settings dialog
window.cacheAllResourcesForOffline = function() {
  return new Promise((resolve, reject) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      console.error('No service worker controlling this page');
      return reject(new Error('Service worker not available'));
    }
    
    console.log('Requesting service worker to cache all resources');
    
    // Create a message channel to get a response from the service worker
    const messageChannel = new MessageChannel();
    
    // Set up the message listener for the response
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.type === 'CACHE_COMPLETE') {
        if (event.data.success) {
          console.log('Service worker successfully cached all resources');
          resolve(true);
        } else {
          console.error('Service worker failed to cache resources:', event.data.error);
          reject(new Error(event.data.error || 'Failed to cache resources'));
        }
      }
    };
    
    // Send the message to the service worker
    navigator.serviceWorker.controller.postMessage(
      { type: 'CACHE_ALL_RESOURCES' },
      [messageChannel.port2]
    );
    
    // Set a timeout in case the service worker doesn't respond
    setTimeout(() => {
      reject(new Error('Service worker did not respond in time'));
    }, 30000); // 30 second timeout
  });
};

const container = document.getElementById('root');
const root = createRoot(container);

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error during initial render:', error);
  container.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1 style="color: red;">Failed to start the application</h1>
      <pre style="text-align: left; background: #f0f0f0; padding: 10px; margin-top: 20px;">
        ${error.toString()}
      </pre>
    </div>
  `;
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note that this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register({
  onUpdate: registration => {
    const waitingServiceWorker = registration.waiting;
    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", event => {
        if (event.target.state === "activated") {
          window.location.reload();
        }
      });
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
