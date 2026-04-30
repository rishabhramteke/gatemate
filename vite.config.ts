import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Site is hosted at https://rishabhramteke.github.io/gatemate/
export default defineConfig({
  plugins: [react()],
  base: '/gatemate/',
});
