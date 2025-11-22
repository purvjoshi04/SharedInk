import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        '../../packages/ui/src/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
                hand: ['var(--font-inter)', 'Inter', 'sans-serif'],
            },
            colors: {
                primary: '#6965db',
                'primary-hover': '#5b57d1',
                'dark-card': '#232323',
                'dark-border': '#404040',
            },
            boxShadow: {
                hand: '2px 2px 0px 0px rgba(0,0,0,1)',
                'hand-hover': '4px 4px 0px 0px rgba(0,0,0,1)',
                'hand-dark': '2px 2px 0px 0px #666666',
                'hand-hover-dark': '4px 4px 0px 0px #666666',
            },
        },
    },
    plugins: [],
};

export default config;