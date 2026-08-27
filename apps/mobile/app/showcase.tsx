import { screenInventory, screenSections } from "@medicare/core";
import { Link } from "expo-router";
import { Card, MobileScreen, SectionTitle } from "../components/mobile-ui";
import { Pressable, Text, View } from "react-native";

export default function ShowcaseScreen() {
  return (
    <MobileScreen activePath="/" title="42 Screen Showcase" subtitle="Development inventory from the Figma plugin">
      <SectionTitle title="Screen inventory" action="All sections" />
      {screenSections.map((section) => (
        <Card key={section}>
          <SectionTitle
            title={section}
            action={`${screenInventory.filter((screen) => screen.section === section).length} screens`}
          />
          <View style={{ gap: 10 }}>
            {screenInventory
              .filter((screen) => screen.section === section)
              .map((screen) => (
                <Link asChild href={{ pathname: "/preview/[slug]", params: { slug: screen.slug } }} key={screen.slug}>
                  <Pressable
                    style={{
                      borderWidth: 1,
                      borderColor: "#d6e1dc",
                      borderRadius: 14,
                      padding: 14,
                      gap: 6
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: "#111827" }}>
                      {screen.id}. {screen.title}
                    </Text>
                    <Text style={{ color: "#6b7280", lineHeight: 20 }}>{screen.summary}</Text>
                  </Pressable>
                </Link>
              ))}
          </View>
        </Card>
      ))}
    </MobileScreen>
  );
}
