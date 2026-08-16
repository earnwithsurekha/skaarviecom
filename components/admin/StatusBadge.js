export default function StatusBadge({ status }) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⏳',
    },
    approved: {
      label: 'Approved',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: '✓',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: '✗',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium border rounded-full ${config.className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
