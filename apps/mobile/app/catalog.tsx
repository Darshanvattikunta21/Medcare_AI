import React, { useState } from "react";
import { CategoryCards, MedicineCards, MobileScreen, SectionTitle } from "../components/mobile-ui";
import { Text, TextInput, View, Pressable, StyleSheet } from "react-native";
import { medicines, categories } from "@medicare/core";

const C = {
  navy: "#0F172A", cyan: "#06B6D4", cyanDark: "#0891B2", cyanLight: "#CFFAFE",
  cyanGlow: "rgba(6,182,212,0.15)", violet: "#8B5CF6",
  white: "#FFFFFF", sky: "#F0F9FF",
  slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate700: "#334155", slate800: "#1E293B", slate900: "#0F172A",
};

export default function CatalogScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"popularity" | "price-low" | "price-high">("popularity");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.description.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = true;
    if (selectedCategory) {
      const catObj = categories.find((c) => c.id === selectedCategory);
      if (catObj) matchesCategory = med.tag.toLowerCase() === catObj.name.toLowerCase();
    }
    return matchesSearch && matchesCategory;
  });

  function parsePrice(str: string): number {
    return Number(str.replace(/[^0-9]/g, "") || 0);
  }

  const sortedMedicines = [...filteredMedicines].sort((a, b) => {
    if (sortBy === "price-low") return parsePrice(a.price) - parsePrice(b.price);
    if (sortBy === "price-high") return parsePrice(b.price) - parsePrice(a.price);
    return a.id.localeCompare(b.id);
  });

  return (
    <MobileScreen activePath="/catalog" title="Browse Medicines" subtitle="Search, compare, and reorder faster">
      {/* Premium search bar */}
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <Text style={styles.searchIcon}>??</Text>
        <TextInput
          placeholder="Paracetamol, fever, stomach care..."
          placeholderTextColor={C.slate400}
          style={styles.searchInput}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          value={searchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Text style={styles.clearText}>?</Text>
          </Pressable>
        )}
      </View>

      <SectionTitle title="Categories" action={selectedCategory ? "Clear filter" : undefined} />
      <CategoryCards selectedId={selectedCategory} onSelect={setSelectedCategory} />

      {/* Sort pills */}
      <View style={styles.sortRow}>
        {([
          { id: "popularity", label: "?? Popular" },
          { id: "price-low", label: "? Price" },
          { id: "price-high", label: "? Price" },
        ] as const).map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => setSortBy(opt.id)}
            style={[styles.sortChip, sortBy === opt.id && styles.sortChipActive]}
          >
            <Text style={[styles.sortText, sortBy === opt.id && styles.sortTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{sortedMedicines.length} items</Text>
        </View>
      </View>

      <SectionTitle title="Products" action={`${sortedMedicines.length} results`} />
      {sortedMedicines.length > 0 ? (
        <MedicineCards items={sortedMedicines} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>??</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>Try a different search or clear filters</Text>
        </View>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.slate200,
    paddingHorizontal: 14, paddingVertical: 2,
    shadowColor: "rgba(6,182,212,0.08)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  searchBarFocused: { borderColor: C.cyan, backgroundColor: "#F0FDFF" },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 14, color: C.slate900, fontSize: 14 },
  clearBtn: { padding: 6 },
  clearText: { color: C.slate400, fontWeight: "700" },
  sortRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  sortChip: {
    borderWidth: 1.5, borderColor: C.slate200, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.white,
  },
  sortChipActive: { borderColor: C.cyan, backgroundColor: C.cyanGlow },
  sortText: { fontSize: 12, color: C.slate500, fontWeight: "600" },
  sortTextActive: { color: C.cyanDark, fontWeight: "800" },
  countBadge: {
    marginLeft: "auto", backgroundColor: C.navy,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  countText: { color: C.cyan, fontSize: 11, fontWeight: "700" },
  emptyContainer: { padding: 40, alignItems: "center", gap: 8, backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.slate200 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.slate800 },
  emptyText: { color: C.slate400, textAlign: "center" },
});
