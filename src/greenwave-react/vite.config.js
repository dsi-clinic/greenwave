// Vite is the build tool. It bundles all your React code into static files
// that any browser can run. You shouldn't need to edit this file often.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // base: '/' means the app expects to be hosted at the root of a domain.
  // If you ever host this in a subfolder (e.g. example.com/greenwave/),
  // change this to '/greenwave/'.
  base: '/',
});
