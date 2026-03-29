import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: 10,
          fontFamily: 'Arial, sans-serif',
          fontSize: '0.875rem',
        },
        success: {
          style: {
            background: '#1F4E79',
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#1F4E79',
          },
        },
        error: {
          style: {
            background: '#e53935',
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#e53935',
          },
        },
      }}
    />
  </StrictMode>
);