/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
            colors: {
                // Gaming Dark Theme Palette
                gaming: {
                    bg: '#0B0B15',        // Deepest void
                    card: '#151525',      // Card background
                    cardHover: '#1E1E30', // Card hover
                    primary: '#6C5DD3',   // Primary Purple
                    accent: '#00E0FF',    // Cyborg Cyan
                    pink: '#FF49DB',      // Neon Pink
                    gold: '#FFD700',      // Gold
                    text: '#FFFFFF',      // White
                    textMuted: '#8E8EA0', // Grey
                },
                // Original Brand Colors (Adapted for Dark Mode)
                brand: {
                    navy: '#182657',
                    darkNavy: '#121F40',
                    magenta: '#BD3E85',
                    gold: '#D59B2D',
                    bronze: '#8D541E',
                }
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            }
        },
    },
    plugins: [],
}
