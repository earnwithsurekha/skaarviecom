'use client';

import { useRouter } from 'next/navigation';
import { Eye, Package } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { formatOrderDate, formatAddress, formatCurrency } from '@/lib/orderUtils';

export default function OrdersTable({ orders, onRefresh }) {
  const router = useRouter();

  const handleViewOrder = (orderId) => {
    router.push(`/manufacturer/orders/${orderId}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product Name</th>
            <th>Customer ID</th>
            <th>Quantity</th>
            <th>Order Date</th>
            <th>Delivery Address</th>
            <th>Payment Status</th>
            <th>Order Status</th>
            <th>Amount</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td>
                <button
                  onClick={() => handleViewOrder(order.id)}
                  className="font-mono text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {order.orderNumber}
                </button>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{order.productName}</p>
                    {order.productSku && (
                      <p className="text-xs text-gray-500">SKU: {order.productSku}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="font-mono text-sm">{order.customerId}</td>
              <td className="font-semibold">{order.totalQuantity}</td>
              <td className="text-sm">{formatOrderDate(order.orderedAt)}</td>
              <td className="max-w-xs truncate text-sm" title={formatAddress(order.shippingAddress)}>
                {formatAddress(order.shippingAddress)}
              </td>
              <td>
                <OrderStatusBadge status={order.paymentStatus} />
              </td>
              <td>
                <OrderStatusBadge status={order.orderStatus} />
              </td>
              <td className="font-semibold text-primary-600">
                {formatCurrency(order.finalAmount)}
              </td>
              <td>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleViewOrder(order.id)}
                    className="btn btn-ghost btn-sm"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
