'use client';

import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';

export default function RegistrationWorkspace({
  icon: Icon,
  networkLabel,
  badgeLabel,
  title,
  description,
  steps = [],
  currentStep = 1,
  availableStep = 1,
  onStepSelect,
  highlights = [],
  completion = 0,
  sectionEyebrow,
  sectionTitle,
  sectionDescription,
  optional = false,
  footer,
  children,
}) {
  const safeCompletion = Math.max(0, Math.min(100, completion));
  const stepGridClassName = steps.length > 3
    ? 'grid grid-cols-2 gap-2 sm:grid-cols-4 lg:block lg:space-y-3'
    : 'grid grid-cols-3 gap-2 lg:block lg:space-y-3';

  return (
    <div className="registration-shell min-h-screen text-slate-900 dark:text-white">
      <header className="border-b border-slate-300 bg-white/95 dark:border-slate-700 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              title="Back to home"
              className="grid h-10 w-10 flex-none place-items-center border border-slate-300 bg-white text-slate-700 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 flex-none place-items-center bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold">SKAARVI</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{networkLabel}</p>
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Secure application</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid overflow-hidden border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="flex flex-col bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white sm:p-8 lg:min-h-[760px] lg:p-10">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 border border-white/25 px-3 py-2 text-xs font-bold uppercase">
                <Icon className="h-4 w-4" />
                {badgeLabel}
              </div>
              <h1 className="max-w-xs text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">{description}</p>
            </div>

            {steps.length > 0 ? (
              <nav aria-label="Registration progress" className={`mt-8 ${stepGridClassName}`}>
                {steps.map(item => {
                  const StepIcon = item.icon;
                  const isActive = item.id === currentStep;
                  const isComplete = item.id < availableStep;
                  const isAvailable = item.id <= availableStep;
                  let stateClassName = 'cursor-not-allowed border-white/10 text-white/35';

                  if (isActive) {
                    stateClassName = 'border-white bg-white text-indigo-700';
                  } else if (isAvailable) {
                    stateClassName = 'border-white/25 text-white hover:border-white/60 hover:bg-white/10';
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => isAvailable && onStepSelect?.(item.id)}
                      disabled={!isAvailable}
                      aria-current={isActive ? 'step' : undefined}
                      className={`group flex min-h-[92px] w-full flex-col items-center justify-center gap-2 border p-3 text-center lg:min-h-0 lg:flex-row lg:justify-start lg:p-4 lg:text-left ${stateClassName}`}
                    >
                      <span className={`grid h-9 w-9 flex-none place-items-center border ${isActive ? 'border-indigo-300' : 'border-current'}`}>
                        {isComplete ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold sm:text-sm">{item.label}</span>
                        <span className={`mt-0.5 hidden text-xs lg:block ${isActive ? 'text-indigo-500' : 'text-blue-100/70'}`}>
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            ) : (
              <div className="mt-8 space-y-3">
                {highlights.map(item => {
                  const HighlightIcon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 border border-white/20 p-4">
                      <span className="grid h-9 w-9 flex-none place-items-center border border-white/40">
                        <HighlightIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold">{item.label}</p>
                        <p className="mt-0.5 text-xs text-blue-100/75">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 border-t border-white/20 pt-6 lg:mt-auto">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-blue-100">Application progress</span>
                <span className="font-bold text-white">{safeCompletion}%</span>
              </div>
              <div className="h-2 border border-white/30 p-px">
                <div
                  className="h-full bg-white transition-[width] duration-500 ease-out"
                  style={{ width: `${safeCompletion}%` }}
                />
              </div>
            </div>
          </aside>

          <section className="min-w-0 bg-white dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-7 dark:border-slate-700 sm:px-10 lg:px-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">{sectionEyebrow}</p>
                {optional && (
                  <span className="border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                    Optional
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{sectionTitle}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{sectionDescription}</p>
            </div>

            <div className="registration-workspace-form px-6 py-7 sm:px-10 sm:py-9 lg:px-12">
              {children}
            </div>

            {footer && (
              <div className="border-t border-slate-200 px-6 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:px-10 lg:px-12">
                {footer}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}