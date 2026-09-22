'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

const isItemActive = (item, pathname) => (
  item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`)
);

export default function MobileRoleNavigation({
  items,
  pathname,
  moreOpen,
  onMoreToggle,
  onNavigate,
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden dark:bg-gray-900/95"
      style={{
        backgroundColor: 'rgb(var(--color-background))',
        borderColor: 'rgb(var(--color-border))',
        gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))`,
      }}
      aria-label="Primary navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.(item)}
            className="relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1"
            style={{
              color: active
                ? 'rgb(var(--color-primary))'
                : 'rgb(var(--color-text-secondary))',
            }}
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <span className="absolute inset-x-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-600" />
            )}
            <span className="relative">
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {item.badge > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </span>
            <span className="max-w-full truncate text-[11px] font-medium">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onMoreToggle}
        className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1"
        style={{
          color: moreOpen
            ? 'rgb(var(--color-primary))'
            : 'rgb(var(--color-text-secondary))',
        }}
        aria-label="More navigation options"
        aria-expanded={moreOpen}
      >
        <MoreHorizontal className="h-5 w-5" strokeWidth={moreOpen ? 2.5 : 2} />
        <span className="text-[11px] font-medium">More</span>
      </button>
    </nav>
  );
}