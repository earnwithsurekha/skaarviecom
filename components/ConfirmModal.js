'use client';

import { X, AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  showInput = false,
  inputLabel = '',
  inputPlaceholder = '',
  inputValue = '',
  onInputChange,
  inputRequired = false,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showInput && inputRequired && !inputValue?.trim()) {
      return;
    }
    onConfirm();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-12 h-12 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'info':
        return <Info className="w-12 h-12 text-blue-600" />;
      default:
        return <AlertCircle className="w-12 h-12 text-yellow-600" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 animate-scale-in"
          style={{ backgroundColor: 'rgb(var(--color-background))' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ color: 'rgb(var(--color-text-secondary))', backgroundColor: 'rgba(var(--color-text-secondary), 0.1)' }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              {getIcon()}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              {title}
            </h3>

            {/* Message */}
            <p className="text-center mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              {message}
            </p>

            {/* Input field if needed */}
            {showInput && (
              <div className="mb-6">
                {inputLabel && (
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                    {inputLabel}
                    {inputRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                <textarea
                  value={inputValue}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  placeholder={inputPlaceholder}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-surface))',
                    color: 'rgb(var(--color-text))',
                    borderColor: 'rgb(var(--color-border))'
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{ 
                  backgroundColor: 'rgb(var(--color-surface))',
                  color: 'rgb(var(--color-text))'
                }}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={showInput && inputRequired && !inputValue?.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
