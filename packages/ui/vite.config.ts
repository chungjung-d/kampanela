import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const SERVER_ORIGIN = process.env['VITE_API_BASE'] ?? 'http://localhost:7357';

// NOTE: only HTTP is proxied through Vite. WebSocket connects to the server
// directly (see packages/ui/src/api/spawn.ts). Vite's ws-proxy fails silently
// on upgrade for this setup — do not add it back without reverifying in the
// browser, not just via raw Node WebSocket.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: SERVER_ORIGIN, changeOrigin: true },
    },
  },
});
