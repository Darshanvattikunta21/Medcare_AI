import { AuthFlowPage } from "../../../../components/flow-pages";

export default async function CheckoutNewAddressPage() {
  return AuthFlowPage({
    slug: "add-address",
    fields: [
      { label: "Address label", placeholder: "Home" },
      { label: "Street address", placeholder: "12 Lake View Residency" },
      { label: "City / State", placeholder: "Bengaluru, Karnataka" },
      { label: "Pin code", placeholder: "560001" }
    ],
    actionLabel: "Save Address"
  });
}

