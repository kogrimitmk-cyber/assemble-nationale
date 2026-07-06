import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Cible de l'API Django. Le port 8000 étant souvent occupé sur cette
// machine par un autre projet, on cible 8010 par défaut (surchargable
// via VITE_API_TARGET dans un fichier .env).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://127.0.0.1:8000';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/media': { target, changeOrigin: true },
      },
    },
  };
});
