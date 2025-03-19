// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

// Use environment variable to determine mode
// This can be set via the package.json scripts or .env file
const DEVELOPMENT_MODE = process.env.REACT_APP_DEV_MODE === 'true';

// Dynamic import based on mode
let AppComponent = App;

if (DEVELOPMENT_MODE) {
  // Using require here allows conditional importing for development mode
  const AppDevelopment = require('./dev/AppDevelopment').default;
  AppComponent = AppDevelopment;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>
);

reportWebVitals();