// Tailwind is a CSS framework. Instead of writing separate .css files,
// you put utility classes like "text-green-700" or "p-4" right on the
// HTML elements in your React components. This file tells Tailwind
// which files to scan for those class names.
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors used throughout the app.
        // Change these here if you want to rebrand.
        brand: {
          green: '#1D9E75',
          darkGreen: '#0F6E50',
          orange: '#D85A30',
          gold: '#B8860B',
          purple: '#7C5CBF',
          navy: '#1a3a32',
        },
      },
    },
  },
  plugins: [],
};
