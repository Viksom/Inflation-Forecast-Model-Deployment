import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 12px 24px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#3730a3',
          600: '#312e81',
        },
      },
    },
  },
  plugins: [],
};

export default config;
