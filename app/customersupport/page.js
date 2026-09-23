'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Headphones, Lock, LogIn, Mail } from 'lucide-react';
import { setCredentials } from '@/store/slices/authSlice';

export default function CustomerSupportLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'customer_support') router.replace('/customersupport/chat');
  }, [router, user?.role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim(), password, userType: 'customer_support' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to sign in');
      if (result.data?.user?.role !== 'customer_support') throw new Error('This account cannot access customer support');

      const { user: supportUser, token, refreshToken } = result.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      dispatch(setCredentials({ user: supportUser, token, refreshToken }));
      router.replace('/customersupport/chat');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef3f7] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="bg-[#12324a] px-8 py-8 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-[#1f9d8a]">
            <Headphones className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Customer Support</h1>
          <p className="mt-1 text-sm text-slate-300">Sign in to manage customer conversations and orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-8">
          {error && <p className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div>
            <label htmlFor="support-email" className="mb-2 block text-sm font-medium text-slate-700">Work email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input id="support-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none focus:border-[#1f9d8a]" autoComplete="username" required />
            </div>
          </div>
          <div>
            <label htmlFor="support-password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input id="support-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none focus:border-[#1f9d8a]" autoComplete="current-password" required />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1f9d8a] px-4 py-3 font-semibold text-white hover:bg-[#178372] disabled:cursor-not-allowed disabled:opacity-60">
            <LogIn className="h-5 w-5" />
            {isSubmitting ? 'Signing in...' : 'Sign in to Support'}
          </button>
        </form>
      </div>
    </main>
  );
}