import { AppShell, ScreenInventoryGrid, SectionHeading } from "../../components/app-ui";

export default function ShowcaseIndexPage() {
  return (
    <AppShell activePath="/" title="42 Screen Showcase" subtitle="Development inventory translated from the Figma plugin">
      <SectionHeading title="Screen inventory" action="All sections" />
      <ScreenInventoryGrid />
    </AppShell>
  );
}

