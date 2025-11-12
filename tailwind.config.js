/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // Override base font sizes to align default Tailwind classes
    // with our design system scale (e.g., text-sm, text-lg, etc.)
    fontSize: {
      // Body
      sm: ["14px", { lineHeight: "24px", fontWeight: "400" }],
      base: ["16px", { lineHeight: "24px", fontWeight: "400" }],
      lg: ["18px", { lineHeight: "28px", fontWeight: "600" }], // aligns with title-m-semibold
      xl: ["20px", { lineHeight: "28px", fontWeight: "600" }], // aligns with title-l-semibold
      // Headlines / display
      "2xl": ["24px", { lineHeight: "32px", fontWeight: "700" }],
      "3xl": ["30px", { lineHeight: "36px", fontWeight: "700" }],
      "4xl": ["38px", { lineHeight: "48px", fontWeight: "700" }],
      "5xl": ["48px", { lineHeight: "60px", fontWeight: "700" }],
    },
    extend: {
      colors: {
        // Map commonly used Tailwind palettes to 360F brand tokens so
        // existing classes like text-slate-900 and text-blue-700 stay consistent.
        slate: {
          50: '#F4F5F5',
          100: '#E8EAEC',
          200: '#D2D5D9',
          300: '#B5BAC0',
          400: '#98A0A8',
          500: '#7C858F',
          600: '#636B75',
          700: '#4A515A',
          800: '#2C2F32',
          900: '#202326',
        },
        blue: {
          50: '#EBF1FF',
          100: '#D6E3FF',
          200: '#ADC7FF',
          300: '#85ABFF',
          400: '#5C8FFF',
          500: '#3373FF',
          600: '#0052E0',
          700: '#003DAD',
          800: '#002979',
          900: '#001446',
        },
        teal: {
          50: '#E5F9FF',
          100: '#CCF3FF',
          200: '#99E7FF',
          300: '#66DBFF',
          400: '#33CFFF',
          500: '#00C3FF',
          600: '#009FCC',
          700: '#007B99',
          800: '#005766',
          900: '#003333',
        },
        // 360F Brand Colors
        primary: {
          50: '#EBF1FF',
          100: '#D6E3FF',
          200: '#ADC7FF',
          300: '#85ABFF',
          400: '#5C8FFF',
          500: '#3373FF',  // Primary brand blue
          600: '#0052E0',
          700: '#003DAD',
          800: '#002979',
          900: '#001446',
        },
        // S360fMenu Colors
        menu: {
          background: '#2044B5',  // S360fMenu deep blue background
          text: '#FFFFFF',
          active: 'rgba(255, 255, 255, 0.3)',
          divider: '#FFFFFF',
        },
        // Neutral/Gray scale
        neutral: {
          0: '#FFFFFF',
          50: '#F4F5F5',
          100: '#E8EAEC',
          200: '#D2D5D9',
          300: '#B5BAC0',
          400: '#98A0A8',
          500: '#7C858F',
          600: '#636B75',
          700: '#4A515A',
          850: '#2C2F32',
          900: '#202326',
          1000: '#020303',
        },
        // Success (Green)
        green: {
          50: '#DDFAEB',
          100: '#BBF5D7',
          200: '#77EBAF',
          300: '#33E187',
          400: '#0ACB69',
          500: '#00A854',  // Success green
          600: '#008644',
          700: '#006433',
          800: '#004322',
          900: '#002111',
        },
        // Warning (Orange)
        orange: {
          50: '#FFF4E5',
          100: '#FFE9CC',
          200: '#FFD399',
          300: '#FFBD66',
          400: '#FFA733',
          500: '#FF9100',  // Warning orange
          600: '#E07400',
          700: '#AD5700',
          800: '#7A3A00',
          900: '#471D00',
        },
        // Error/Danger (Red)
        red: {
          50: '#FFE5E7',
          100: '#FFCCCF',
          200: '#FF999F',
          300: '#FF666F',
          400: '#FF333F',
          500: '#F8333C',  // Error red
          600: '#DC0010',
          700: '#A9000C',
          800: '#760008',
          900: '#430004',
        },
        // Info (Yellow)
        yellow: {
          50: '#FFF9E5',
          100: '#FFF3CC',
          200: '#FFE799',
          300: '#FFDB66',
          400: '#FFCF33',
          500: '#FFC300',  // Info yellow
          600: '#E0A600',
          700: '#AD8000',
          800: '#7A5A00',
          900: '#473300',
        },
        // Cyan/Teal accent
        cyan: {
          50: '#E5F9FF',
          100: '#CCF3FF',
          200: '#99E7FF',
          300: '#66DBFF',
          400: '#33CFFF',
          500: '#00C3FF',
          600: '#009FCC',
          700: '#007B99',
          800: '#005766',
          900: '#003333',
        },
        // Foreground colors (semantic)
        foreground: {
          primary: '#020303',
          secondary: '#4A515A',
          tertiary: '#7C858F',
          disabled: '#B5BAC0',
          success: '#00A854',
          warning: '#FF9100',
          error: '#F8333C',
        },
        // Background colors (semantic)
        background: {
          primary: '#FFFFFF',
          secondary: '#EBF1FF',
          tertiary: '#F4F5F5',
          elevated: '#FFFFFF',
          muted: '#E8EAEC',
          success: '#DDFAEB',
          warning: '#FFF4E5',
          error: '#FFE5E7',
          info: '#FFF9E5',
        },
        // Border colors (semantic)
        border: {
          default: '#D2D5D9',
          accent: '#3373FF',
          muted: '#F4F5F5',
        },
        // Link colors
        link: {
          default: '#3373FF',
          hover: '#0052E0',
          visited: '#003DAD',
        },
      },
      spacing: {
        '2xs': '4px',
        'xs': '8px',
        's': '12px',
        'm': '16px',
        'l': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },
      // Use CSS variables for easy switching based on Figma tokens
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // Display styles - Hero sections and major headlines
        'display-m': ['48px', { lineHeight: '60px', fontWeight: '300' }],
        'display-m-bold': ['48px', { lineHeight: '60px', fontWeight: '700' }],
        'display-s': ['38px', { lineHeight: '48px', fontWeight: '300' }],
        'display-s-bold': ['38px', { lineHeight: '48px', fontWeight: '700' }],

        // Headline styles - Section headers
        'headline-m': ['30px', { lineHeight: '36px', fontWeight: '300' }],
        'headline-m-bold': ['30px', { lineHeight: '36px', fontWeight: '700' }],
        'headline-s': ['24px', { lineHeight: '32px', fontWeight: '300' }],
        'headline-s-bold': ['24px', { lineHeight: '32px', fontWeight: '700' }],

        // Title styles - Page and card titles
        'title-l': ['20px', { lineHeight: '28px', fontWeight: '300' }],
        'title-l-semibold': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'title-l-bold': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'title-m': ['18px', { lineHeight: '28px', fontWeight: '700' }],
        'title-m-semibold': ['18px', { lineHeight: '28px', fontWeight: '600' }],

        // Body styles - Main content text
        'body-m': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-m-light': ['16px', { lineHeight: '24px', fontWeight: '300' }],
        'body-m-semibold': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-s': ['14px', { lineHeight: '24px', fontWeight: '400' }],
        'body-s-light': ['14px', { lineHeight: '24px', fontWeight: '300' }],
        'body-s-semibold': ['14px', { lineHeight: '24px', fontWeight: '600' }],
        'body-s-tight': ['14px', { lineHeight: '16px', fontWeight: '400' }],

        // Label styles - UI labels and buttons
        'label-l': ['14px', { lineHeight: '24px', fontWeight: '400' }],
        'label-l-light': ['14px', { lineHeight: '24px', fontWeight: '300' }],
        'label-l-semibold': ['14px', { lineHeight: '24px', fontWeight: '600' }],
        'label-m': ['12px', { lineHeight: '24px', fontWeight: '600' }],
        'label-s': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-s-semibold': ['12px', { lineHeight: '16px', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};
