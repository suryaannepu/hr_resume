/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#eef7ff',
                    100: '#d9edff',
                    200: '#bce0ff',
                    300: '#8eceff',
                    400: '#59b1ff',
                    500: '#3b8bff',
                    600: '#1e6bf5',
                    700: '#1755e1',
                    800: '#1946b6',
                    900: '#1a3d8f',
                    950: '#152757',
                },
                emerald: {
                    50: '#ecfdf5',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                },
                amber: {
                    50: '#fffbeb',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                },
                rose: {
                    50: '#fff1f2',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                },
                slate: {
                    750: '#293548',
                    850: '#172033',
                    925: '#0c1322',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            animation: {
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-in': 'slideIn 0.4s ease-out',
                'fade-in': 'fadeIn 0.6s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'bounce-slow': 'bounce 2s infinite',
                'spin-slow': 'spin 8s linear infinite',
                'progress': 'progress 1.5s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(59, 139, 255, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(59, 139, 255, 0.8)' },
                },
                progress: {
                    '0%': { width: '0%' },
                    '50%': { width: '70%' },
                    '100%': { width: '100%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
