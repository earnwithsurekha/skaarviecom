'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Factory, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedManufacturerPage() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // If user is already a manufacturer, redirect to manufacturer dashboard
    if (user && user.role === 'manufacturer') {
      router.push('/manufacturer/dashboard');
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
                   style={{ backgroundColor: 'rgb(var(--color-warning))' }}></div>
              <div className="relative rounded-full p-4" 
                   style={{ backgroundColor: 'rgba(var(--color-warning), 0.1)' }}>
                <Factory className="w-16 h-16" style={{ color: 'rgb(var(--color-warning))' }} />
                <Lock className="w-8 h-8 absolute bottom-2 right-2" 
                      style={{ color: 'rgb(var(--color-warning))' }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-3" 
              style={{ color: 'rgb(var(--color-text-primary))' }}>
            Manufacturer Access Required
          </h1>

          {/* Subtitle */}
          <p className="text-center mb-6" 
             style={{ color: 'rgb(var(--color-text-secondary))' }}>
            This area is exclusively for registered manufacturers
          </p>

          {/* Alert Box */}
          <div className="rounded-lg p-4 mb-6 flex items-start gap-3" 
               style={{ backgroundColor: 'rgba(var(--color-warning), 0.1)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" 
                          style={{ color: 'rgb(var(--color-warning))' }} />
            <div>
              <p className="text-sm font-medium mb-1" 
                 style={{ color: 'rgb(var(--color-warning))' }}>
                Access Restricted
              </p>
              <p className="text-sm" 
                 style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Only verified manufacturers can access this portal. If you're a manufacturer and don't have an account, please register or contact support.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!user ? (
              <>
                <Link href="/login/manufacturer" 
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-primary))',
                        color: 'white'
                      }}>
                  <Lock className="w-4 h-4" />
                  Login as Manufacturer
                </Link>
                <Link href="/manufacturer/register" 
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        backgroundColor: 'rgba(var(--color-primary), 0.1)',
                        color: 'rgb(var(--color-primary))'
                      }}>
                  <Factory className="w-4 h-4" />
                  Register as Manufacturer
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
          Want to become a manufacturer?{' '}
          <Link href="/manufacturer/register" 
                className="underline hover:opacity-70 transition-opacity"
                style={{ color: 'rgb(var(--color-primary))' }}>
            Apply here
          </Link>
        </p>
      </div>
    </div>
  );
}
