import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH lets us deploy to either GitHub Pages (sub-path) or Firebase
// Hosting (root). Firebase Hosting workflow sets BASE_PATH=/, GH Pages
// workflow leaves it unset and we fall back to the sub-path.
const base = process.env.BASE_PATH ?? '/gatemate/';

export default defineConfig({
  plugins: [react()],
  base,
});
