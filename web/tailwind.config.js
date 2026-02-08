/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563eb',
                available: '#22c55e',
                occupied: '#ef4444',
                reserved: '#f97316',
                maintenance: '#6b7280',
            },
        },
    },
    plugins: [],
}
