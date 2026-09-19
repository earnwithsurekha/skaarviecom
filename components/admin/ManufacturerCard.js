import StatusBadge from './StatusBadge';
import { Eye } from 'lucide-react';

export default function ManufacturerRow({ manufacturer, onClick }) {
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
    <tr
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      className="cursor-pointer transition-colors"
      style={{
        borderTop: '1px solid rgb(var(--color-border))',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = 'rgb(var(--color-surface))';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <td className="px-5 py-4 align-top">
        <div className="max-w-xs">
          <div className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
            {manufacturer.companyName}
          </div>
          <div className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            {manufacturer.brandName || 'No brand name'}
          </div>
          {manufacturer.approvalStatus === 'rejected' && manufacturer.rejectionReason && (
            <div className="mt-1 max-w-xs truncate text-xs text-red-600" title={manufacturer.rejectionReason}>
              Rejected: {manufacturer.rejectionReason}
            </div>
          )}
          {manufacturer.isActive === false && manufacturer.suspensionReason && (
            <div className="mt-1 max-w-xs truncate text-xs text-red-600" title={manufacturer.suspensionReason}>
              Suspended: {manufacturer.suspensionReason}
            </div>
          )}
        </div>
      </td>
      <td className="px-5 py-4 align-top">
        <div className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
          {manufacturer.contactPerson || 'N/A'}
        </div>
        <div className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          {manufacturer.phoneNumber || manufacturer.mobile || 'N/A'}
        </div>
        <div className="mt-1 max-w-[220px] truncate text-sm" title={manufacturer.email} style={{ color: 'rgb(var(--color-text-secondary))' }}>
          {manufacturer.email || 'N/A'}
        </div>
      </td>
      <td className="px-5 py-4 align-top text-sm whitespace-nowrap" style={{ color: 'rgb(var(--color-text-secondary))' }}>
        {formattedDate}
      </td>
      <td className="px-5 py-4 align-top text-center font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
        {manufacturer.productCount || 0}
      </td>
      <td className="px-5 py-4 align-top text-right font-semibold whitespace-nowrap" style={{ color: 'rgb(var(--color-text))' }}>
        {formatCurrency(manufacturer.totalSales || 0)}
      </td>
      <td className="px-5 py-4 align-top">
        <div className="flex flex-col items-start gap-2">
          <StatusBadge status={manufacturer.approvalStatus} />
          {manufacturer.isActive === false && (
            <span className="rounded border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
              Suspended
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4 align-top text-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-opacity hover:opacity-70"
          style={{ color: 'rgb(var(--color-primary))' }}
          title="View manufacturer details"
          aria-label={`View details for ${manufacturer.companyName}`}
        >
          <Eye className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}
