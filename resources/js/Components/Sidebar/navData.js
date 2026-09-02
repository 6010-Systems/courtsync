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
            { name: 'Dashboard',    href: 'dashboard',    icon: LayoutGrid,    badge: null },
        ],
    },
    {
        title: 'Management',
        items: [
            { name: 'Bookings',     href: '#',            icon: CalendarCheck, badge: 3    },
            { name: 'Calendar',     href: '#',            icon: Calendar,      badge: null },
            { name: 'Facilities',   href: '#',            icon: Building2,     badge: null },
            { name: 'Courts',       href: '#',            icon: ClipboardList, badge: null },
        ],
    },
    {
        title: 'People & Finance',
        items: [
            { name: 'Customers',    href: '#',            icon: Users,         badge: null },
            { name: 'Staff',        href: '#',            icon: UserCheck,     badge: null },
            { name: 'Payments',     href: '#',            icon: CreditCard,    badge: null },
        ],
    },
    {
        title: 'System',
        items: [
            { name: 'Reports',      href: '#',            icon: BarChart2,     badge: null },
            { name: 'Verification', href: '#',            icon: ShieldCheck,   badge: null },
        ],
    },
];

export const allNavItems = navSections.flatMap(section => section.items);
