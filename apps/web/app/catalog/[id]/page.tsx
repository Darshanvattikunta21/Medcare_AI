import { CatalogFlowPage } from "../../../components/flow-pages";

export default async function CatalogItemPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return CatalogFlowPage({ slug: "medicine-detail", medicineId: id });
}

