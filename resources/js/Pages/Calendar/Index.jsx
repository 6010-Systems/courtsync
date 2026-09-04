import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BookingsPage from '@/Components/Bookings/BookingsPage';
import { Head } from '@inertiajs/react';

export default function CalendarIndex(props) {
    return (
        <AuthenticatedLayout>
            <Head title="Facility Calendar & Bookings" />
            <BookingsPage {...props} />
        </AuthenticatedLayout>
    );
}
