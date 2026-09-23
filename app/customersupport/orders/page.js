'use client';

import CustomerSupportShell from '@/components/support/CustomerSupportShell';
import SupportOrders from '@/components/support/SupportOrders';

export default function CustomerSupportOrdersPage() {
  return (
    <CustomerSupportShell>
      <SupportOrders />
    </CustomerSupportShell>
  );
}