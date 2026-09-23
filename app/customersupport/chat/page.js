'use client';

import SupportInbox from '@/components/support/SupportInbox';
import CustomerSupportShell from '@/components/support/CustomerSupportShell';

export default function CustomerSupportChatPage() {
  return (
    <CustomerSupportShell>
      <SupportInbox title="Support Inbox" description="Respond to customers and keep conversations moving" />
    </CustomerSupportShell>
  );
}