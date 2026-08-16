'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    platformFeePercentage: 5,
    defaultSkaarviMargin: 5,
    defaultResellerCommission: 10,
    lowStockThreshold: 10,
    settlementHoldDays: 7
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null
  });

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setSettings(data.data.settings);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load settings' });
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.status === 'success') {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        setSettings(data.data.settings);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update settings' });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all settings to defaults? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setSaving(true);
          setMessage({ type: '', text: '' });

          const response = await fetch('/api/admin/settings/reset', {
            method: 'POST',
            credentials: 'include'
          });

          const data = await response.json();

          if (data.status === 'success') {
            setMessage({ type: 'success', text: 'Settings reset to defaults!' });
            setSettings(data.data.settings);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
          } else {
            setMessage({ type: 'error', text: data.message || 'Failed to reset settings' });
          }
        } catch (error) {
          console.error('Reset settings error:', error);
          setMessage({ type: 'error', text: 'Failed to reset settings' });
        } finally {
          setSaving(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>Platform Settings</h1>
        <p className="mt-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Configure global platform settings for pricing margins and operational parameters.
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{
          backgroundColor: message.type === 'success' ? 'rgba(var(--color-success), 0.1)' : 'rgba(var(--color-danger), 0.1)',
          color: message.type === 'success' ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))',
          border: `1px solid ${message.type === 'success' ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))'}`
        }}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="card">
        <div className="p-6" style={{ borderBottom: '1px solid rgb(var(--color-border))' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--color-text))' }}>Pricing Configuration</h2>
          <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            These settings apply to all new products created by manufacturers.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Platform Fee Percentage */}
          <div>
            <label className="label">
              Platform Fee Percentage (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={settings.platformFeePercentage}
              onChange={(e) => handleChange('platformFeePercentage', e.target.value)}
              className="input w-full"
            />
            <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Fee charged on each order (deducted from manufacturer revenue).
            </p>
          </div>

          {/* Default Skaarvi Margin */}
          <div>
            <label className="label">
              Default Skaarvi Margin (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={settings.defaultSkaarviMargin}
              onChange={(e) => handleChange('defaultSkaarviMargin', e.target.value)}
              className="input w-full"
            />
            <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Default profit margin for Skaarvi on product pricing.
            </p>
          </div>

          {/* Default Reseller Commission */}
          <div>
            <label className="label">
              Default Reseller Commission (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={settings.defaultResellerCommission}
              onChange={(e) => handleChange('defaultResellerCommission', e.target.value)}
              className="input w-full"
            />
            <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Commission percentage for resellers selling products.
            </p>
          </div>

          {/* Divider */}
          <div className="my-6" style={{ borderTop: '1px solid rgb(var(--color-border))' }}></div>

          {/* Low Stock Threshold */}
          <div>
            <label className="label">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              max="1000"
              step="1"
              value={settings.lowStockThreshold}
              onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
              className="input w-full"
            />
            <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Default threshold to trigger low stock alerts for products.
            </p>
          </div>

          {/* Settlement Hold Days */}
          <div>
            <label className="label">
              Settlement Hold Days
            </label>
            <input
              type="number"
              min="0"
              max="90"
              step="1"
              value={settings.settlementHoldDays}
              onChange={(e) => handleChange('settlementHoldDays', e.target.value)}
              className="input w-full"
            />
            <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Number of days to hold payments before processing settlements.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex items-center justify-between rounded-b-lg" style={{ 
          backgroundColor: 'rgb(var(--color-surface))',
          borderTop: '1px solid rgb(var(--color-border))'
        }}>
          <button
            onClick={handleReset}
            disabled={saving}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Important Notes</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Changes apply to all new products created after saving.</li>
              <li>• Existing products retain their current pricing margins.</li>
              <li>• You can override margins for individual products from the Products page.</li>
              <li>• Settings are applied immediately without server restart.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Reset"
        cancelText="Cancel"
      />
    </div>
  );
}
