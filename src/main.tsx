import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import './index.css';
import './lib/i18n';
import App from './App.tsx';
import { queryClient } from './lib/query-client';
import { ensureApiReady } from './lib/axios';
import { tryRecoverFromChunkError } from './lib/chunk-recovery';

window.addEventListener('vite:preloadError', (event) => {
  const customEvent = event as unknown as CustomEvent<{ payload?: unknown }>;
  const error = customEvent.detail?.payload;

  if (tryRecoverFromChunkError(error)) {
    customEvent.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

void ensureApiReady();
