import StatusBadge from './StatusBadge';
import { Calendar, Building2, Tag, Phone, Mail, Package, DollarSign } from 'lucide-react';

export default function ManufacturerCard({ manufacturer, onClick }) {
  const formattedDate = new Date(manufacturer.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div
      onClick={onClick}
      className="rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer border"
      style={{
        backgroundColor: 'rgb(var(--color-background))',
        borderColor: 'rgb(var(--color-border))'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
            {manufacturer.companyName}
          </h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            <Tag className="w-4 h-4" />
            <span>{manufacturer.brandName}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <StatusBadge status={manufacturer.approvalStatus} />
          {manufacturer.isActive === false && (
            <span className="px-2 py-1 text-xs font-medium rounded" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'rgb(239, 68, 68)',
            }}>
              Suspended
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span>{manufacturer.contactPerson}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          <span>{manufacturer.phoneNumber || manufacturer.mobile || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          <span className="truncate">{manufacturer.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Registered: {formattedDate}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgb(var(--color-border))' }}>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" style={{ color: 'rgb(var(--color-primary))' }} />
          <div>
            <div className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>Products</div>
            <div className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.productCount || 0}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} />
          <div>
            <div className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>Total Sales</div>
            <div className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>{formatCurrency(manufacturer.totalSales || 0)}</div>
          </div>
        </div>
      </div>

      {manufacturer.approvalStatus === 'rejected' && manufacturer.rejectionReason && (
        <div className="mt-3 p-2 rounded text-xs" style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'rgb(239, 68, 68)',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <strong>Rejected:</strong> {manufacturer.rejectionReason}
        </div>
      )}

      {manufacturer.isActive === false && manufacturer.suspensionReason && (
        <div className="mt-3 p-2 rounded text-xs" style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'rgb(239, 68, 68)',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <strong>Suspended:</strong> {manufacturer.suspensionReason}
        </div>
      )}

      <button 
        className="mt-4 w-full py-2 text-sm font-medium rounded-lg transition-all hover:opacity-90 active:scale-95"
        style={{
          backgroundColor: 'rgb(var(--color-primary))',
          color: 'white'
        }}
      >
        View Details
      </button>
    </div>
  );
}
