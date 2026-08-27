import { AppShell } from "../../components/app-ui";
import { CartView } from "../../components/cart-view";

export default function CartPage() {
  return (
    <AppShell activePath="/cart" title="Cart & Checkout" subtitle="Review medicines, address, and payment">
      <CartView />
    </AppShell>
  );
}
