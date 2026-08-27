import { InfoFlowPage } from "../../../components/flow-pages";

export default async function SettingsAboutPage() {
  return InfoFlowPage({ slug: "about-terms", activePath: "/profile" });
}

