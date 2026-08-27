import { AppShell } from "../../../components/app-ui";
import { OrderTrackingClient } from "../../../components/order-tracking-client";

export default function OrdersTrackingPage() {
  return (
    <AppShell activePath="/orders" title="Orders & Tracking" subtitle="Timeline, payment status, and delivery-stage controls">
      <OrderTrackingClient />
    </AppShell>
  );
}
