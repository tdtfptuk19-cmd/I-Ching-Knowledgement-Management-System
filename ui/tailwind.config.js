/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        iching: {
          primary: '#8b4513',    // Saddle brown / Gỗ trầm
          secondary: '#c8864d',  // Đồng cổ / Hoàng thổ
          accent: '#b91c1c',     // Đỏ chu sa
          dark: '#1c1917',       // Đen nghiên mực
          light: '#fdfbf7',      // Giấy điệp cổ
          paper: '#f5efe6',      // Giấy hoàng trúc
          gold: '#d97706',       // Vàng ánh kim
        }
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', '"Source Han Serif"', 'Georgia', 'Cambria', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
