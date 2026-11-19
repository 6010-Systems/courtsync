import Dropdown from '@/Components/Dropdown';
import { usePage } from '@inertiajs/react';
import { Menu, Search } from 'lucide-react';

export default function Header({ title, onMenuClick }) {
    const user = usePage().props.auth.user;
    const initials = user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="rounded-xl bg-brand-surface-subtle p-2.5 text-brand-text-muted transition hover:text-brand-dark lg:hidden"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <h1 className="truncate font-display text-2xl tracking-tight text-brand-dark">
                    {title}
                </h1>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                <div className="relative hidden min-w-0 flex-1 md:block md:max-w-[220px] lg:max-w-xs">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-subtle" />
                    <input
                        type="search"
                        placeholder="Search bookings, courts..."
                        className="w-full rounded-full border-0 bg-brand-surface-subtle py-2.5 pl-10 pr-4 text-sm text-brand-dark placeholder:text-brand-text-subtle focus:ring-2 focus:ring-brand-primary"
                    />
                </div>

                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            type="button"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-brand-primary ring-2 ring-brand-surface-subtle transition hover:ring-brand-primary/40"
                        >
                            {initials}
                        </button>
                    </Dropdown.Trigger>

                    <Dropdown.Content align="right" width="48">
                        <div className="border-b border-brand-border-subtle px-4 py-3">
                            <p className="text-sm font-medium text-brand-dark">
                                {user.name}
                            </p>
                            <p className="truncate text-xs text-brand-text-muted">
                                {user.email}
                            </p>
                        </div>
                        <Dropdown.Link href={route('profile.edit')}>
                            Profile
                        </Dropdown.Link>
                        <Dropdown.Link
                            href={route('logout')}
                            method="post"
                            as="button"
                        >
                            Log out
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        </header>
    );
}
