/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Libre Baskerville', 'Georgia', 'serif'],
                sans: ['Nunito', 'sans-serif'],
            },
            colors: {
                parchment: {
                    50: '#fdfcf9',
                    100: '#f9f6ed',
                    200: '#f3edd9',
                    300: '#e8dfc0',
                    400: '#d6c99e',
                    500: '#c4b17c',
                    600: '#a99361',
                    700: '#8a7550',
                    800: '#6b5a42',
                    900: '#4d4033',
                },
            },
            animation: {
                'blink': 'blink 1s ease-in-out infinite',
                'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
                'fade-in': 'fade-in 0.3s ease-out forwards',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                blink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                'gentle-bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(3px)' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(5px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
            },
        },
    },
    plugins: [],
};