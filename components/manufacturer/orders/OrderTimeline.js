'use client';

import { CheckCircle, Circle, Clock, Package, Truck, XCircle } from 'lucide-react';
import { ORDER_STATUS, formatOrderDate } from '@/lib/orderUtils';

export default function OrderTimeline({ currentStatus, statusHistory, orderedAt, shippedAt, deliveredAt }) {
  const getStatusIcon = (status, isActive, isCompleted) => {
    // Show green checkmark for delivered status (both active and completed)
    if (status === ORDER_STATUS.DELIVERED && (isActive || isCompleted)) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
    
    const iconClass = isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400';
    
    if (isCompleted) return <CheckCircle className={`w-6 h-6 ${iconClass}`} />;
    if (isActive) return <Clock className={`w-6 h-6 ${iconClass} animate-pulse`} />;
    return <Circle className={`w-6 h-6 ${iconClass}`} />;
  };

  const timelineSteps = [
    {
      status: ORDER_STATUS.NEW,
      label: 'Order Placed',
      timestamp: orderedAt
    },
    {
      status: ORDER_STATUS.ACCEPTED,
      label: 'Order Accepted',
      timestamp: statusHistory?.find(h => h.newStatus === ORDER_STATUS.ACCEPTED)?.changedAt
    },
    {
      status: ORDER_STATUS.PROCESSING,
      label: 'Processing',
      timestamp: statusHistory?.find(h => h.newStatus === ORDER_STATUS.PROCESSING)?.changedAt
    },
    {
      status: ORDER_STATUS.SHIPPED,
      label: 'Shipped',
      timestamp: shippedAt
    },
    {
      status: ORDER_STATUS.DELIVERED,
      label: 'Delivered',
      timestamp: deliveredAt
    }
  ];

  const getCurrentStepIndex = () => {
    const statusOrder = [
      ORDER_STATUS.NEW,
      ORDER_STATUS.ACCEPTED,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.DELIVERED
    ];
    return statusOrder.indexOf(currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = currentStatus === ORDER_STATUS.CANCELLED;
  const isReturned = currentStatus === ORDER_STATUS.RETURNED;

  return (
    <div className="space-y-6">
      {/* Show cancelled/returned status first if applicable */}
      {(isCancelled || isReturned) && (
        <div className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">
              {isCancelled ? 'Order Cancelled' : 'Order Returned'}
            </h4>
            <p className="text-sm text-red-700 mt-1">
              {statusHistory?.find(h => h.newStatus === currentStatus)?.notes || 
               `This order has been ${isCancelled ? 'cancelled' : 'returned'}.`}
            </p>
            {statusHistory?.find(h => h.newStatus === currentStatus)?.changedAt && (
              <p className="text-xs text-red-600 mt-2">
                {formatOrderDate(statusHistory.find(h => h.newStatus === currentStatus).changedAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timeline Steps */}
      <div className="relative">
        {timelineSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isDisabled = isCancelled || isReturned;

          return (
            <div key={step.status} className="relative pb-8 last:pb-0">
              {/* Connecting Line */}
              {index < timelineSteps.length - 1 && (
                <div
                  className={`absolute left-3 top-8 w-0.5 h-full -ml-px transition-colors ${
                    isCompleted && !isDisabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}

              {/* Step Content */}
              <div className={`flex items-start gap-4 ${isDisabled ? 'opacity-50' : ''}`}>
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status, isActive && !isDisabled, isCompleted && !isDisabled)}
                </div>

                {/* Details */}
                <div className="flex-1 pt-0.5">
                  <h4 className={`font-semibold ${
                    // Show green for delivered status when active
                    step.status === ORDER_STATUS.DELIVERED && isActive && !isDisabled ? 'text-green-900' :
                    isActive && !isDisabled ? 'text-primary-600' : 
                    isCompleted && !isDisabled ? 'text-green-900' : 
                    'text-gray-600'
                  }`}>
                    {step.label}
                  </h4>
                  
                  {step.timestamp && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatOrderDate(step.timestamp)}
                    </p>
                  )}

                  {/* Show notes if available */}
                  {statusHistory?.find(h => h.newStatus === step.status)?.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      {statusHistory.find(h => h.newStatus === step.status).notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status History Details */}
      {statusHistory && statusHistory.length > 0 && (
        <div className="border-t pt-6 mt-6" style={{ borderColor: 'rgb(var(--color-border))' }}>
          <h4 className="font-semibold mb-4 text-gray-900">Complete Status History</h4>
          <div className="space-y-3">
            {statusHistory.slice().reverse().map((history, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border"
                style={{ borderColor: 'rgb(var(--color-border))' }}
              >
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{history.oldStatus || 'Initial'}</span>
                    {' → '}
                    <span className="font-medium text-primary-600">{history.newStatus}</span>
                  </p>
                  {history.notes && (
                    <p className="text-xs text-gray-600 mt-1">{history.notes}</p>
                  )}
                  {history.changedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Changed by: {history.changedBy} ({history.changedByRole})
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {formatOrderDate(history.changedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
