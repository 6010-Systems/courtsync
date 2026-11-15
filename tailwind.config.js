import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{jsx,tsx,ts,js}',
    ],

    theme: {
        extend: {
            fontFamily: {
                // Body / UI text — Inter with Quicksand fallback
                sans: ['Inter', 'Quicksand', ...defaultTheme.fontFamily.sans],

                // Display / Title — Poppins (geometric, bold, clean visual hierarchy)
                display: ['Poppins', ...defaultTheme.fontFamily.sans],

                // Legacy alias kept for backward compat — remapped to Poppins
                montserrat: ['Poppins', ...defaultTheme.fontFamily.sans],

                // Explicit named aliases for use in JSX
                quicksand: ['Quicksand', ...defaultTheme.fontFamily.sans],
                poppins:   ['Poppins',   ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
