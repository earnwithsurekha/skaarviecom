'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Headphones, LogOut, MessageSquare, PackageSearch } from 'lucide-react';
import { logout } from '@/store/slices/authSlice';

const navigation = [
  { href: '/customersupport/chat', label: 'Chat', icon: MessageSquare },
  { href: '/customersupport/orders', label: 'Orders', icon: PackageSearch },
];

export default function CustomerSupportShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user && user.role !== 'customer_support') router.replace('/unauthorized');
    if (!user) router.replace('/customersupport');
  }, [router, user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch(logout());
    router.replace('/customersupport');
  };

  if (user?.role !== 'customer_support') return null;

  return (
    <div className="min-h-screen bg-[#eef3f7]">
      <header className="border-b border-slate-700 bg-[#12324a] text-white">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Headphones className="h-6 w-6 shrink-0 text-[#52d1bd]" />
            <div className="min-w-0">
              <p className="font-semibold">Skaarvi Customer Support</p>
              <p className="truncate text-xs text-slate-300">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <nav className="flex items-center rounded-md bg-slate-900/30 p-1" aria-label="Support workspace">
              {navigation.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex h-9 items-center gap-2 rounded px-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-white text-[#12324a]' : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded hover:bg-white/10"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[96rem] p-4 sm:p-6">{children}</main>
    </div>
  );
}