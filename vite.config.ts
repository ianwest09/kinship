import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: {
      // The preview is served over HTTPS through a reverse proxy, so the
      // browser must use the proxy's secure WebSocket port for HMR.
      clientPort: 443,
    },
  },
});
