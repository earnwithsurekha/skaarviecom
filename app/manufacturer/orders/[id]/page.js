'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard,
  Truck,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import OrderStatusBadge from '@/components/manufacturer/orders/OrderStatusBadge';
import OrderTimeline from '@/components/manufacturer/orders/OrderTimeline';
import ShippingDetailsModal from '@/components/manufacturer/orders/ShippingDetailsModal';
import { formatOrderDate, formatAddress, formatCurrency, getAvailableActions, ORDER_STATUS } from '@/lib/orderUtils';
import ConfirmModal from '@/components/ConfirmModal';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${params.id}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.status === 'success') {
        setOrder(data.data.order);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Fetch order details error:', error);
      toast.error(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      title: 'Accept Order',
      message: 'Are you sure you want to accept this order? You will be responsible for fulfilling it.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setActionLoading(true);
          const response = await fetch(`/api/orders/${params.id}/accept`, {
            method: 'POST',
            credentials: 'include'
          });

          const data = await response.json();

          if (data.status === 'success') {
            toast.success('Order accepted successfully!');
            fetchOrderDetails();
          } else {
            throw new Error(data.message);
          }
        } catch (error) {
          console.error('Accept order error:', error);
          toast.error(error.message || 'Failed to accept order');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleUpdateToProcessing = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: ORDER_STATUS.PROCESSING,
          notes: 'Order is being processed'
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Order updated to processing!');
        fetchOrderDetails();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Update order error:', error);
      toast.error(error.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    setConfirmModal({
      isOpen: true,
      type: 'success',
      title: 'Mark as Delivered',
      message: 'Confirm that this order has been successfully delivered to the customer?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setActionLoading(true);
          const response = await fetch(`/api/orders/${params.id}/deliver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              notes: 'Order delivered successfully'
            })
          });

          const data = await response.json();

          if (data.status === 'success') {
            toast.success('Order marked as delivered!');
            fetchOrderDetails();
          } else {
            throw new Error(data.message);
          }
        } catch (error) {
          console.error('Mark delivered error:', error);
          toast.error(error.message || 'Failed to mark order as delivered');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Order not found</h3>
        <button onClick={() => router.back()} className="btn btn-outline">
          Go Back
        </button>
      </div>
    );
  }

  const availableActions = getAvailableActions(order.orderStatus);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10" style={{ 
        backgroundColor: 'rgb(var(--color-background))',
        borderColor: 'rgb(var(--color-border))'
      }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                    {order.orderNumber}
                  </h1>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Ordered on {formatOrderDate(order.orderedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {availableActions.includes('accept') && (
                <button
                  onClick={handleAcceptOrder}
                  disabled={actionLoading}
                  className="btn btn-success btn-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Order
                </button>
              )}
              {availableActions.includes('updateToProcessing') && (
                <button
                  onClick={handleUpdateToProcessing}
                  disabled={actionLoading}
                  className="btn btn-primary btn-sm"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Start Processing
                </button>
              )}
              {availableActions.includes('ship') && (
                <button
                  onClick={() => setShowShippingModal(true)}
                  disabled={actionLoading}
                  className="btn btn-primary btn-sm"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Mark as Shipped
                </button>
              )}
              {availableActions.includes('deliver') && (
                <button
                  onClick={handleMarkDelivered}
                  disabled={actionLoading}
                  className="btn btn-success btn-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="card">
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.productName}</td>
                        <td className="text-gray-600">{item.productSku || 'N/A'}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.sellingPrice)}</td>
                        <td className="font-semibold">{formatCurrency(item.itemTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(order.finalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="card">
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <h2 className="text-lg font-semibold">Order Status Timeline</h2>
              </div>
              <div className="p-6">
                <OrderTimeline
                  currentStatus={order.orderStatus}
                  statusHistory={order.statusHistory || []}
                  orderedAt={order.orderedAt}
                  shippedAt={order.shippedAt}
                  deliveredAt={order.deliveredAt}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="card">
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Details
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="font-medium">{order.customerId}</p>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card">
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm">{formatAddress(order.shippingAddress)}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="card">
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">{order.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <OrderStatusBadge status={order.paymentStatus} />
                </div>
                {order.paymentId && (
                  <div>
                    <p className="text-sm text-gray-600">Payment ID</p>
                    <p className="font-mono text-sm">{order.paymentId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Information */}
            {(order.trackingNumber || order.courierPartner) && (
              <div className="card">
                <div className="px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Details
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  {order.courierPartner && (
                    <div>
                      <p className="text-sm text-gray-600">Courier Partner</p>
                      <p className="font-medium">{order.courierPartner}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Tracking Number</p>
                      <p className="font-mono text-sm">{order.trackingNumber}</p>
                    </div>
                  )}
                  {order.shippedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Shipped On</p>
                      <p className="font-medium">{formatOrderDate(order.shippedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Shipping Modal */}
      {showShippingModal && (
        <ShippingDetailsModal
          orderId={params.id}
          onClose={() => setShowShippingModal(false)}
          onSuccess={() => {
            setShowShippingModal(false);
            fetchOrderDetails();
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.type === 'success' ? 'Mark Delivered' : 'Accept'}
        cancelText="Cancel"
      />
    </div>
  );
}
