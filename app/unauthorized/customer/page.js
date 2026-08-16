'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ShoppingBag, Lock, AlertTriangle, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedCustomerPage() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // If user is already a customer, redirect appropriately
    if (user && user.role === 'customer') {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ 
           backgroundColor: 'rgb(var(--color-surface))',
           backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(var(--color-primary), 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(var(--color-secondary), 0.1) 0%, transparent 50%)'
         }}>
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="rounded-2xl shadow-2xl p-8 backdrop-blur-sm" 
             style={{ 
               backgroundColor: 'rgb(var(--color-background))',
               border: '1px solid rgb(var(--color-border))'
             }}>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-50" 
                   style={{ backgroundColor: 'rgb(var(--color-info))' }}></div>
              <div className="relative rounded-full p-4" 
                   style={{ backgroundColor: 'rgba(var(--color-info), 0.1)' }}>
                <ShoppingBag className="w-16 h-16" style={{ color: 'rgb(var(--color-info))' }} />
                <Lock className="w-8 h-8 absolute bottom-2 right-2" 
                      style={{ color: 'rgb(var(--color-info))' }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-3" 
              style={{ color: 'rgb(var(--color-text-primary))' }}>
            Customer Login Required
          </h1>

          {/* Subtitle */}
          <p className="text-center mb-6" 
             style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Please sign in to access your account and continue shopping
          </p>

          {/* Alert Box */}
          <div className="rounded-lg p-4 mb-6 flex items-start gap-3" 
               style={{ backgroundColor: 'rgba(var(--color-info), 0.1)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" 
                          style={{ color: 'rgb(var(--color-info))' }} />
            <div>
              <p className="text-sm font-medium mb-1" 
                 style={{ color: 'rgb(var(--color-info))' }}>
                Authentication Required
              </p>
              <p className="text-sm" 
                 style={{ color: 'rgb(var(--color-text-secondary))' }}>
                You need to be logged in as a customer to access this feature. Create an account or sign in to continue.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!user ? (
              <>
                <Link href="/login/customer" 
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-primary))',
                        color: 'white'
                      }}>
                  <User className="w-4 h-4" />
                  Login as Customer
                </Link>
                <Link href="/register/customer" 
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        backgroundColor: 'rgba(var(--color-primary), 0.1)',
                        color: 'rgb(var(--color-primary))'
                      }}>
                  <ShoppingBag className="w-4 h-4" />
                  Create Customer Account
                </Link>

              </>
            ) : (
              <button 
                onClick={() => router.back()}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: 'rgb(var(--color-primary))',
                  color: 'white'
                }}>
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
            
            <Link href="/" 
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200"
                  style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Return to Homepage
            </Link>
          </div>

          {/* Benefits List */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgb(var(--color-border))' }}>
            <p className="text-sm font-medium mb-3 text-center" 
               style={{ color: 'rgb(var(--color-text-primary))' }}>
              Benefits of Creating an Account:
            </p>
            <ul className="space-y-2 text-sm" 
                style={{ color: 'rgb(var(--color-text-secondary))' }}>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" 
                     style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
                Track your orders in real-time
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" 
                     style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
                Save items to your wishlist
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" 
                     style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
                Faster checkout process
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" 
                     style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
                Access exclusive deals and offers
              </li>
            </ul>
          </div>

          {/* Current User Info */}
          {user && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgb(var(--color-border))' }}>
              <p className="text-xs text-center" 
                 style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Logged in as: <span className="font-medium">{user.email}</span>
                <br />
                Role: <span className="font-medium capitalize">{user.role}</span>
              </p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <p className="text-center mt-6 text-sm" 
           style={{ color: 'rgb(var(--color-text-secondary))' }}>
          New to Skaarvi?{' '}
          <Link href="/register/customer" 
                className="underline hover:opacity-70 transition-opacity"
                style={{ color: 'rgb(var(--color-primary))' }}>
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
