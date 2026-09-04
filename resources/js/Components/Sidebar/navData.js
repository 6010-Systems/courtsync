import {
    BarChart2,
    Building2,
    Calendar,
    CalendarCheck,
    ClipboardList,
    CreditCard,
    LayoutGrid,
    Settings,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';

export const navSections = [
    {
        title: 'Main',
        items: [
            { name: 'Dashboard',    href: 'dashboard',          icon: LayoutGrid,    badge: null },
        ],
    },
    {
        title: 'Management',
        items: [
            { name: 'Bookings',     href: 'bookings.index',     icon: CalendarCheck, badge: 3    },
            { name: 'Calendar',     href: 'calendar.index',     icon: Calendar,      badge: null },
            { name: 'Facilities',   href: 'facilities.index',   icon: Building2,     badge: null },
            { name: 'Courts',       href: 'courts.index',       icon: ClipboardList, badge: null },
        ],
    },
    {
        title: 'People & Finance',
        items: [
            { name: 'Customers',    href: 'customers.index',    icon: Users,         badge: null },
            { name: 'Staff',        href: 'staff.index',        icon: UserCheck,     badge: null },
            { name: 'Payments',     href: 'payments.index',     icon: CreditCard,    badge: null },
        ],
    },
    {
        title: 'System',
        items: [
            { name: 'Reports',      href: 'reports.index',      icon: BarChart2,     badge: null },
            { name: 'Verification', href: 'verification.index', icon: ShieldCheck,   badge: null },
        ],
    },
];

export const allNavItems = navSections.flatMap(section => section.items);
