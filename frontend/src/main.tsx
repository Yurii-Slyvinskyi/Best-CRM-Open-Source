import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './app/providers/app-provider';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider />
  </StrictMode>,
);
