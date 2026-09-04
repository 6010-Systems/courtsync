import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BookingsPage from '@/Components/Bookings/BookingsPage';
import { Head } from '@inertiajs/react';

export default function BookingsIndex(props) {
    return (
        <AuthenticatedLayout>
            <Head title="Facility Bookings & Calendar" />
            <BookingsPage {...props} />
        </AuthenticatedLayout>
    );
}
