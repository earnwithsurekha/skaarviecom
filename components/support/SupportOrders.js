'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Loader2,
  MapPin,
  PackageSearch,
  Search,
  Truck,
  UserRound,
  X,
} from 'lucide-react';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-sky-100 text-sky-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  returned: 'bg-slate-200 text-slate-800',
};

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Not available';

const formatAddress = (value) => {
  if (!value) return 'Not provided';
  if (typeof value === 'object') return Object.values(value).filter(Boolean).join(', ');
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' ? Object.values(parsed).filter(Boolean).join(', ') : value;
  } catch {
    return value;
  }
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
    {status || 'unknown'}
  </span>
);

const DetailRow = ({ label, value }) => (
  <div className="grid gap-1 border-b border-slate-100 py-2 last:border-0 sm:grid-cols-[9rem_1fr]">
    <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
    <dd className="break-words text-sm text-slate-900">{value || 'Not available'}</dd>
  </div>
);

export default function SupportOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          status,
          search,
          page: String(pagination.page),
          limit: '20',
        });
        const response = await fetch(`/api/admin/orders?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error('Unable to load orders');
        const result = await response.json();
        setOrders(result.data.orders || []);
        setPagination(result.data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [pagination.page, search, status]);

  const applySearch = (event) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 1 }));
    setSearch(searchInput.trim());
  };

  const openOrder = async (orderId) => {
    setDetailsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Unable to load order details');
      const result = await response.json();
      setSelectedOrder({
        ...result.data.order,
        items: result.data.items || [],
        statusHistory: result.data.statusHistory || [],
      });
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const manufacturers = selectedOrder?.items
    ?.map((item) => [item.manufacturerName, item.manufacturerBrand].filter(Boolean).join(' - '))
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ');

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#12324a]">Orders</h1>
        <p className="mt-1 text-sm text-slate-600">Review every order and identify the manufacturer fulfilling each item.</p>
      </div>

      <div className="flex flex-col gap-3 border-y border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <form onSubmit={applySearch} className="flex min-w-0 flex-1 gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search orders</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-10 w-full rounded border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#167d76] focus:ring-2 focus:ring-[#167d76]/20"
              placeholder="Order number or customer"
            />
          </label>
          <button className="h-10 rounded bg-[#167d76] px-4 text-sm font-semibold text-white hover:bg-[#11665f]" type="submit">
            Search
          </button>
        </form>
        <label>
          <span className="sr-only">Order status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPagination((current) => ({ ...current, page: 1 }));
            }}
            className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm sm:w-44"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="w-16 px-4 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan="7" className="h-40 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#167d76]" /></td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="h-40 text-center text-slate-500">
                    <PackageSearch className="mx-auto mb-2 h-8 w-8" />
                    No orders found
                  </td>
                </tr>
              )}
              {!loading && orders.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">#{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.orderedAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{order.customerName || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{order.customerEmail}</p>
                  </td>
                  <td className="max-w-52 px-4 py-3 text-slate-600"><p className="truncate" title={order.productNames}>{order.productNames || 'Not available'}</p></td>
                  <td className="max-w-48 px-4 py-3 text-slate-700"><p className="truncate" title={order.manufacturerName}>{order.manufacturerName || 'Unassigned'}</p></td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.orderStatus} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openOrder(order.orderId)}
                      className="flex h-9 w-9 items-center justify-center rounded text-[#167d76] hover:bg-teal-50"
                      aria-label={`View order ${order.orderNumber}`}
                      title="View order details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          <span>{pagination.total} orders</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
              disabled={pagination.page <= 1 || loading}
              className="flex h-9 w-9 items-center justify-center rounded border border-slate-300 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
            <button
              onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="flex h-9 w-9 items-center justify-center rounded border border-slate-300 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {detailsLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
      )}

      {selectedOrder && (
        <dialog open className="fixed inset-0 z-50 !m-0 flex h-dvh max-h-none w-full max-w-none box-border items-center justify-center bg-slate-950/60 p-3 sm:p-6" aria-label={`Order ${selectedOrder.orderNumber} details`} onCancel={() => setSelectedOrder(null)}>
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-md bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-[#12324a]">Order #{selectedOrder.orderNumber}</h2>
                  <StatusBadge status={selectedOrder.orderStatus} />
                </div>
                <p className="mt-1 text-xs text-slate-500">Placed {formatDate(selectedOrder.orderedAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="flex h-9 w-9 items-center justify-center rounded hover:bg-slate-100" aria-label="Close details">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-7 p-5 sm:p-6">
              <section>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><Building2 className="h-4 w-4 text-[#167d76]" />Fulfilling manufacturers</h3>
                <p className="border-l-4 border-[#52d1bd] bg-teal-50 px-4 py-3 text-sm font-medium text-slate-900">{manufacturers || 'No manufacturer assigned'}</p>
              </section>

              <div className="grid gap-6 lg:grid-cols-3">
                <section>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><UserRound className="h-4 w-4 text-[#167d76]" />Customer</h3>
                  <dl><DetailRow label="Name" value={selectedOrder.customerName} /><DetailRow label="Email" value={selectedOrder.customerEmail} /><DetailRow label="Phone" value={selectedOrder.customerPhone} /></dl>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-slate-900">Order and payment</h3>
                  <dl><DetailRow label="Payment" value={selectedOrder.paymentStatus} /><DetailRow label="Method" value={selectedOrder.paymentMethod} /><DetailRow label="Payment ID" value={selectedOrder.paymentId} /><DetailRow label="Reseller" value={selectedOrder.resellerName || 'Direct sale'} /><DetailRow label="Reseller email" value={selectedOrder.resellerEmail} /></dl>
                </section>
                <section>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><Truck className="h-4 w-4 text-[#167d76]" />Delivery</h3>
                  <dl><DetailRow label="Courier" value={selectedOrder.courierPartner} /><DetailRow label="Tracking" value={selectedOrder.trackingNumber} /><DetailRow label="Shipped" value={selectedOrder.shippedAt ? formatDate(selectedOrder.shippedAt) : null} /><DetailRow label="Delivered" value={selectedOrder.deliveredAt ? formatDate(selectedOrder.deliveredAt) : null} /></dl>
                </section>
              </div>

              <section>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-4 w-4 text-[#167d76]" />Addresses</h3>
                <div className="grid gap-4 border-y border-slate-200 py-4 md:grid-cols-2">
                  <div><p className="text-xs font-medium uppercase text-slate-500">Shipping</p><p className="mt-1 text-sm text-slate-900">{formatAddress(selectedOrder.shippingAddress)}</p></div>
                  <div><p className="text-xs font-medium uppercase text-slate-500">Billing</p><p className="mt-1 text-sm text-slate-900">{formatAddress(selectedOrder.billingAddress)}</p></div>
                </div>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-slate-900">Items and manufacturers</h3>
                <div className="overflow-x-auto border border-slate-200">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Manufacturer</th><th className="px-4 py-3">Brand</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Total</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-3 font-medium text-slate-900">{item.productName || item.product_name || `Item ${index + 1}`}</td>
                          <td className="px-4 py-3 text-slate-700">{item.manufacturerName || 'Unassigned'}</td>
                          <td className="px-4 py-3 text-slate-600">{item.manufacturerBrand || 'Not available'}</td>
                          <td className="px-4 py-3 text-slate-600">{item.quantity || 1}</td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrency(item.selling_price || item.price)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(item.item_total || ((Number(item.selling_price || item.price) || 0) * (Number(item.quantity) || 1)))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <section>
                  <h3 className="mb-2 font-semibold text-slate-900">Pricing</h3>
                  <dl><DetailRow label="Subtotal" value={formatCurrency(selectedOrder.subtotal)} /><DetailRow label="Shipping" value={formatCurrency(selectedOrder.shippingCharges)} /><DetailRow label="Discount" value={formatCurrency(selectedOrder.discountAmount)} /><DetailRow label="Final amount" value={formatCurrency(selectedOrder.finalAmount || selectedOrder.totalAmount)} /></dl>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-slate-900">Additional information</h3>
                  <dl><DetailRow label="Notes" value={selectedOrder.notes} /><DetailRow label="Cancelled reason" value={selectedOrder.cancelledReason} /><DetailRow label="Cancelled" value={selectedOrder.cancelledAt ? formatDate(selectedOrder.cancelledAt) : null} /></dl>
                </section>
              </div>

              {selectedOrder.statusHistory.length > 0 && (
                <section>
                  <h3 className="mb-2 font-semibold text-slate-900">Status history</h3>
                  <div className="divide-y divide-slate-100 border-y border-slate-200">
                    {selectedOrder.statusHistory.map((entry, index) => (
                      <div key={entry.id || index} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                        <span className="font-medium capitalize text-slate-900">{entry.status || entry.new_status || 'Updated'}</span>
                        <span className="text-slate-500">{formatDate(entry.changed_at || entry.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}