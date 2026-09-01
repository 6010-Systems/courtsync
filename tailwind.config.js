import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                brand: {
                    primary: 'var(--cs-primary)',
                    'primary-hover': 'var(--cs-primary-hover)',
                    'primary-foreground': 'var(--cs-primary-foreground)',
                    'primary-muted': 'var(--cs-primary-muted)',
                    dark: 'var(--cs-dark)',
                    'dark-muted': 'var(--cs-dark-muted)',
                    'dark-elevated': 'var(--cs-dark-elevated)',
                    cream: 'var(--cs-cream)',
                    accent: 'var(--cs-accent)',
                    'accent-muted': 'var(--cs-accent-muted)',
                    'accent-surface': 'var(--cs-accent-surface)',
                    surface: 'var(--cs-surface)',
                    'surface-muted': 'var(--cs-surface-muted)',
                    'surface-subtle': 'var(--cs-surface-subtle)',
                    canvas: 'var(--cs-canvas)',
                    text: 'var(--cs-text)',
                    'text-muted': 'var(--cs-text-muted)',
                    'text-subtle': 'var(--cs-text-subtle)',
                    'text-on-dark': 'var(--cs-text-on-dark)',
                    'text-on-dark-muted': 'var(--cs-text-on-dark-muted)',
                    border: 'var(--cs-border)',
                    'border-subtle': 'var(--cs-border-subtle)',
                    'border-dark': 'var(--cs-border-dark)',
                },
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                display: ['Anton', ...defaultTheme.fontFamily.sans],
            },
            width: {
                sidebar: 'var(--cs-sidebar-width)',
            },
            maxWidth: {
                sidebar: 'var(--cs-sidebar-width)',
            },
        },
    },

    plugins: [forms],
};
