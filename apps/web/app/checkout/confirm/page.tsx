import { AppShell } from "../../../components/app-ui";
import { CheckoutConfirmClient } from "../../../components/checkout-confirm-client";

export default function CheckoutConfirmPage() {
  return (
    <AppShell activePath="/cart" title="Order Confirm" subtitle="Review address, payment, and order total">
      <CheckoutConfirmClient />
    </AppShell>
  );
}
