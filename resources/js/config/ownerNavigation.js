import {
    BarChart3,
    Building2,
    Calendar,
    CalendarDays,
    ClipboardList,
    CreditCard,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    UserCog,
    Users,
} from 'lucide-react';

export const ownerNavigation = [
    {
        label: 'General',
        items: [
            {
                name: 'Dashboard',
                routeName: 'dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
            },
            {
                name: 'Bookings',
                routeName: 'owner.bookings',
                href: '/owner/bookings',
                icon: CalendarDays,
                badge: 2,
            },
            {
                name: 'Calendar',
                routeName: 'owner.calendar',
                href: '/owner/calendar',
                icon: Calendar,
            },
            {
                name: 'Facilities',
                routeName: 'owner.facilities',
                href: '/owner/facilities',
                icon: Building2,
            },
            {
                name: 'Courts',
                routeName: 'owner.courts',
                href: '/owner/courts',
                icon: ClipboardList,
            },
        ],
    },
    {
        label: 'Management',
        items: [
            {
                name: 'Customers',
                routeName: 'owner.customers',
                href: '/owner/customers',
                icon: Users,
            },
            {
                name: 'Staff',
                routeName: 'owner.staff',
                href: '/owner/staff',
                icon: UserCog,
            },
            {
                name: 'Payments',
                routeName: 'owner.payments',
                href: '/owner/payments',
                icon: CreditCard,
            },
            {
                name: 'Reports',
                routeName: 'owner.reports',
                href: '/owner/reports',
                icon: BarChart3,
            },
        ],
    },
    {
        label: 'Account',
        items: [
            {
                name: 'Verification',
                routeName: 'owner.verification',
                href: '/owner/verification',
                icon: ShieldCheck,
            },
            {
                name: 'Settings',
                routeName: 'owner.settings',
                href: '/owner/settings',
                icon: Settings,
            },
        ],
    },
];
