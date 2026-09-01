import '../css/app.css';
import './bootstrap';

import { LoadingProvider } from '@/Components/LoadingContext';
import { ToastProvider } from '@/Components/ToastContext';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'CourtSync';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <LoadingProvider>
                <ToastProvider>
                    <App {...props} />
                </ToastProvider>
            </LoadingProvider>
        );
    },
    progress: {
        color: '#D6FF3F',
    },
});
