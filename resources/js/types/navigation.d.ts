import { ComponentType } from 'react';
import { UserRole } from './enums';

export interface NavItemDef {
    name: string;
    href: string;
    icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    badge: string | number | null;
    roles?: UserRole[];
}

export interface NavSectionDef {
    title: string;
    items: NavItemDef[];
}
