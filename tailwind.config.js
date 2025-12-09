/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Noto Sans', 'system-ui', 'sans-serif'],
        'heading': ['Lexend Deca', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Figma Design System Typography
        'headline-small': ['24px', { lineHeight: '32px', fontWeight: '500' }],
        'title-large': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'title-medium': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'label-large': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'label-medium': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label-small': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'body-large': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-medium': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'body-small-italic': ['12px', { lineHeight: '16px', fontWeight: '400', fontStyle: 'italic' }],
      },
      colors: {
        // Surface colors
        surface: {
          DEFAULT: '#ffffff',
          'variant-1': '#f9f9f9',
          'variant-2': '#f5f5f5',
          'dark': '#e5e5e5',
          'on-surface': '#191919',
          'on-surface-variant-1': '#2d2d2d',
          'on-surface-variant-2': '#636363',
          'on-surface-variant-3': '#888888',
          'outline': '#cdcdcd',
          'outline-dark': '#767676',
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#0095ff',
        },
        // Primary colors
        primary: {
          'on-primary': '#ffffff',
        },
        // Semantic colors
        semantic: {
          'informative': '#0068b3',
        },
        // Custom colors for AI Writing
        custom: {
          'cyan-container': '#52c7db',
          'purple-container': '#b78cfc',
        },
      },
      boxShadow: {
        'elevation-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.24), 0px 1px 4px 0px rgba(0, 0, 0, 0.16)',
        'elevation-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.24), 0px 2px 8px 0px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  plugins: [],
}