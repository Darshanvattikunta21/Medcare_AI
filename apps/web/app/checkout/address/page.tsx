import { InfoFlowPage } from "../../../components/flow-pages";

export default async function CheckoutAddressPage() {
  return InfoFlowPage({ slug: "delivery-address", activePath: "/cart" });
}

