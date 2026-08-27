import { OrdersFlowPage } from "../../../components/flow-pages";

export default async function CheckoutPaymentPage() {
  return OrdersFlowPage({ slug: "payment" });
}

