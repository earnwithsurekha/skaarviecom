'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Phone,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import { formatPrice } from '@/lib/cartUtils';
import { canCancelOrder, canReturnOrder } from '@/lib/orderUtils';
import CancelOrderModal from '@/components/customer/CancelOrderModal';
import ReturnOrderModal from '@/components/customer/ReturnOrderModal';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/customer/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setOrder(data.data.order);
        setItems(data.data.items || []);
      } else {
        toast.error(data.message || 'Failed to fetch order details');
        router.push('/customer/orders');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
      router.push('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (reason) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/customer/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Order cancelled successfully');
        setShowCancelModal(false);
        // Refresh order details
        await fetchOrderDetails();
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnOrder = async ({ reason, description, images }) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/customer/orders/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, description, images }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Return request submitted successfully');
        setShowReturnModal(false);
        // Refresh order details
        await fetchOrderDetails();
      } else {
        toast.error(data.message || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Error submitting return request:', error);
      toast.error('Failed to submit return request');
    } finally {
      setActionLoading(false);
    }
  };

  const getOrderStatusConfig = (status) => {
    const config = {
      pending: { 
        icon: Clock, 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: 'Order Pending',
        description: 'Your order is being processed'
      },
      processing: { 
        icon: Package, 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        label: 'Processing',
        description: 'We are preparing your order'
      },
      shipped: { 
        icon: Truck, 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
        label: 'Shipped',
        description: 'Your order is on the way'
      },
      delivered: { 
        icon: CheckCircle, 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        label: 'Delivered',
        description: 'Order delivered successfully'
      },
      cancelled: { 
        icon: XCircle, 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        label: 'Cancelled',
        description: 'This order has been cancelled'
      },
    };

    return config[status] || config.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Order not found
        </h2>
        <Link
          href="/customer/orders"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const statusConfig = getOrderStatusConfig(order.order_status);
  const StatusIcon = statusConfig.icon;

  // Check cancel/return eligibility
  const cancelEligibility = canCancelOrder(order);
  const returnEligibility = canReturnOrder(order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/customer/orders')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order Details
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Order #{order.order_number}
            </p>
          </div>
        </div>
      </div>

      {/* Order Status Banner */}
      <div className={`${statusConfig.color} rounded-lg p-6`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <StatusIcon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{statusConfig.label}</h2>
            <p className="text-sm opacity-90">{statusConfig.description}</p>
            <p className="text-xs opacity-75 mt-2">
              Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              {cancelEligibility.eligible && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 
                           text-red-600 dark:text-red-400 font-medium rounded-lg shadow-sm 
                           transition-colors flex items-center gap-2 text-sm"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </button>
              )}

              {returnEligibility.eligible && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-4 py-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 
                           text-blue-600 dark:text-blue-400 font-medium rounded-lg shadow-sm 
                           transition-colors flex items-center gap-2 text-sm"
                >
                  <Package className="h-4 w-4" />
                  Return Order
                  {returnEligibility.daysRemaining !== undefined && (
                    <span className="text-xs opacity-75">
                      ({returnEligibility.daysRemaining} {returnEligibility.daysRemaining === 1 ? 'day' : 'days'} left)
                    </span>
                  )}
                </button>
              )}

              {order.return_status && (
                <div className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm text-sm">
                  <span className="font-medium">Return Status: </span>
                  <span className={`font-bold ${
                    order.return_status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                    order.return_status === 'approved' ? 'text-green-600 dark:text-green-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {order.return_status.charAt(0).toUpperCase() + order.return_status.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items ({items.length})
            </h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.product_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Quantity: {item.quantity}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatPrice(item.subtotal)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({formatPrice(item.price)} each)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </h2>

            {order.shipping_address && (
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p className="font-semibold">{order.shipping_address.fullName}</p>
                <p className="text-sm">{order.shipping_address.address}</p>
                <p className="text-sm">
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {order.shipping_address.mobile}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    {order.shipping_address.email}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Method</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`font-semibold ${
                  order.payment_status === 'pending' 
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Price Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  FREE
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(order.final_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>
                  Ordered: {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Package className="h-4 w-4" />
                <span>Order ID: {order.order_number}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        order={order}
        onConfirm={handleCancelOrder}
        loading={actionLoading}
      />

      {/* Return Order Modal */}
      <ReturnOrderModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        order={order}
        daysRemaining={returnEligibility.daysRemaining}
        onConfirm={handleReturnOrder}
        loading={actionLoading}
      />
    </div>
  );
}
