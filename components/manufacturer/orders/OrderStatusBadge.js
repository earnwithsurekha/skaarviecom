'use client';

import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  RotateCcw 
} from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/orderUtils';

export default function OrderStatusBadge({ status }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  // Map status to icon
  const getStatusIcon = () => {
    const iconClass = "w-3.5 h-3.5";
    
    switch (status?.toLowerCase()) {
      case 'new':
      case 'pending':
        return <Clock className={iconClass} />;
      case 'accepted':
      case 'processing':
        return <Package className={iconClass} />;
      case 'shipped':
        return <Truck className={iconClass} />;
      case 'delivered':
        return <CheckCircle className={iconClass} />;
      case 'cancelled':
        return <XCircle className={iconClass} />;
      case 'returned':
        return <RotateCcw className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        colorClasses[color] || colorClasses.gray
      }`}
    >
      {getStatusIcon()}
      {label}
    </span>
  );
}
