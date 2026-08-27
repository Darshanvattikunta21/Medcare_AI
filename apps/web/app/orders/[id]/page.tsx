import { AppShell } from "../../../components/app-ui";
import { OrderTrackingClient } from "../../../components/order-tracking-client";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell activePath="/orders" title="Order Detail" subtitle="Live order state, payment details, and tracking history">
      <OrderTrackingClient initialOrderId={id} />
    </AppShell>
  );
}
