"use client";

import { fetchCatalog, fetchCategories, addCartItem, getErrorMessage } from "@medicare/api-client";
import { categories as fallbackCategories, medicines as fallbackMedicines } from "@medicare/core";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell, SectionHeading } from "../../components/app-ui";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Medicine = (typeof fallbackMedicines)[number] & {
  prescriptionRequired?: boolean;
  stockStatus?: string;
};
type Category = (typeof fallbackCategories)[number];

type SortOption = "default" | "price-asc" | "price-desc" | "name";

/* ─── Category icon map ─────────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, string> = {
  tablets: "💊",
  injections: "💉",
  devices: "🩺",
  ayurveda: "🌿",
  baby: "🍼",
  "first-aid": "🩹"
};

/* ─── Tag colour map ─────────────────────────────────────────────────────── */
function tagStyle(tag: string): { bg: string; color: string } {
  const t = tag.toLowerCase();
  if (t === "rx") return { bg: "#fee2e2", color: "#dc2626" };
  if (t === "ai pick") return { bg: "#ede9fe", color: "#7c3aed" };
  if (t === "popular") return { bg: "#fef3c7", color: "#b45309" };
  if (t === "new") return { bg: "#d1fae5", color: "#065f46" };
  if (t === "vaccine") return { bg: "#dbeafe", color: "#1d4ed8" };
  return { bg: "#f0fdf9", color: "#0f6e56" };
}

/* ─── Medicine card ──────────────────────────────────────────────────────── */
function MedicineCard({
  item,
  onAddToCart
}: {
  item: Medicine;
  onAddToCart: (id: string, name: string) => void;
}) {
  const ts = tagStyle(item.tag);
  const outOfStock = item.stockStatus === "out_of_stock";
  const icon = CATEGORY_ICONS[item.category] ?? "💊";

  return (
    <article style={{
      background: "#ffffff",
      borderRadius: 20,
      border: "1px solid #e5e7eb",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      transition: "transform 0.15s, box-shadow 0.15s",
      opacity: outOfStock ? 0.65 : 1
    }}>
      {/* Icon + tags row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg,#f0fdf9,#d1fae5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
            padding: "2px 8px", borderRadius: 99,
            background: ts.bg, color: ts.color
          }}>
            {item.tag.toUpperCase()}
          </span>
          {outOfStock && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444" }}>OUT OF STOCK</span>
          )}
        </div>
      </div>

      {/* Name & brand */}
      <div>
        <strong style={{ fontSize: 14, color: "#111827", display: "block", lineHeight: 1.35 }}>
          {item.name}
        </strong>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{item.brand}</span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5, flexGrow: 1, margin: 0 }}>
        {item.description}
      </p>

      {/* Price + CTA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
        <strong style={{ fontSize: 18, color: "#0f6e56" }}>{item.price}</strong>
        <button
          disabled={outOfStock || item.prescriptionRequired}
          onClick={() => onAddToCart(item.id, item.name)}
          style={{
            padding: "8px 14px",
            borderRadius: 12,
            border: "none",
            background: outOfStock || item.prescriptionRequired ? "#e5e7eb" : "linear-gradient(135deg,#1d9e75,#25ab82)",
            color: outOfStock || item.prescriptionRequired ? "#9ca3af" : "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: outOfStock || item.prescriptionRequired ? "not-allowed" : "pointer",
            transition: "opacity 0.15s"
          }}
          title={item.prescriptionRequired ? "Prescription required" : undefined}
        >
          {item.prescriptionRequired ? "Rx Required" : outOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

/* ─── Skeleton loader ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 20, border: "1px solid #e5e7eb", padding: 16,
      display: "flex", flexDirection: "column", gap: 10,
      animation: "pulse 1.5s ease-in-out infinite"
    }}>
      {[48, 14, 12, 38].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 10, background: "#f3f4f6" }} />
      ))}
    </div>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get("category") ?? "";
  const initialQ = searchParams.get("q") ?? "";

  const [categoryItems, setCategoryItems] = useState<Category[]>(fallbackCategories);
  const [items, setItems] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState<string | null>(null);

  // Active filters (local state — no page refresh needed)
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialQ);
  const [sort, setSort] = useState<SortOption>("default");

  /* Fetch categories once */
  useEffect(() => {
    fetchCategories()
      .then(setCategoryItems)
      .catch(() => setCategoryItems(fallbackCategories));
  }, []);

  /* Fetch products whenever filters change */
  const fetchItems = useCallback(() => {
    setLoading(true);
    const sortParam = sort === "default" ? undefined : sort as "name" | "price-asc" | "price-desc";
    fetchCatalog({ q: search, category: activeCategory || undefined, sort: sortParam, limit: 50 })
      .then((result) => {
        // fetchCatalog may return { items, pagination } or plain array depending on API version
        const arr = Array.isArray(result) ? result : (result as { items?: Medicine[] }).items ?? [];
        setItems(arr as Medicine[]);
      })
      .catch(() => {
        // Fallback: client-side filter the core data
        let filtered = fallbackMedicines.filter((m) => {
          const q = search.toLowerCase();
          const matchQ = !q || m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
          const matchCat = !activeCategory || m.category === activeCategory;
          return matchQ && matchCat;
        });
        if (sort === "price-asc") filtered = [...filtered].sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, "")) - parseFloat(b.price.replace(/[^0-9.]/g, "")));
        if (sort === "price-desc") filtered = [...filtered].sort((a, b) => parseFloat(b.price.replace(/[^0-9.]/g, "")) - parseFloat(a.price.replace(/[^0-9.]/g, "")));
        if (sort === "name") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        setItems(filtered);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, search, sort]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* Cart handler */
  async function handleAddToCart(id: string, name: string) {
    try {
      await addCartItem({ medicineId: id, quantity: 1 });
      setCartMsg(`✓ ${name} added to cart`);
      window.dispatchEvent(new CustomEvent("medicare:cart-updated"));
      setTimeout(() => setCartMsg(null), 2500);
    } catch {
      setCartMsg(`Could not add ${name} — please try again`);
      setTimeout(() => setCartMsg(null), 2500);
    }
  }

  /* Select category */
  function selectCategory(id: string) {
    setActiveCategory(id === activeCategory ? "" : id);
  }

  const activeCategoryLabel = categoryItems.find((c) => c.id === activeCategory)?.name;

  return (
    <AppShell
      activePath="/catalog"
      title="Browse Medicines"
      subtitle={activeCategoryLabel ? `Showing: ${activeCategoryLabel}` : "Search, filter & reorder faster"}
    >
      {/* Cart toast */}
      {cartMsg && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "#111827", color: "#fff", borderRadius: 12, padding: "10px 18px",
          fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
        }}>
          {cartMsg}
        </div>
      )}

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicine, brand, symptom…"
          style={{ flex: 1, borderRadius: 14, padding: "12px 16px", fontSize: 13 }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              border: "1px solid #e5e7eb", borderRadius: 14, padding: "0 14px",
              background: "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#6b7280"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Sort */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Sort by:</span>
        {(["default", "price-asc", "price-desc", "name"] as SortOption[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{
              fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 99,
              border: "1.5px solid",
              borderColor: sort === s ? "#1d9e75" : "#e5e7eb",
              background: sort === s ? "#f0fdf9" : "#fff",
              color: sort === s ? "#0f6e56" : "#6b7280",
              cursor: "pointer"
            }}
          >
            {s === "default" ? "Relevance" : s === "price-asc" ? "₹ Low→High" : s === "price-desc" ? "₹ High→Low" : "A–Z"}
          </button>
        ))}
      </div>

      {/* Category filter chips */}
      <SectionHeading title="Categories" action={activeCategory ? "× Clear" : ""} />
      {activeCategory && (
        <div style={{ marginTop: -8, marginBottom: 4 }}>
          <button
            onClick={() => setActiveCategory("")}
            style={{
              fontSize: 11, color: "#dc2626", background: "transparent", border: "none",
              cursor: "pointer", fontWeight: 700, padding: 0
            }}
          >
            × Clear category filter
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveCategory("")}
          style={{
            padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700,
            border: "1.5px solid",
            borderColor: !activeCategory ? "#1d9e75" : "#d1d5db",
            background: !activeCategory ? "#f0fdf9" : "#fff",
            color: !activeCategory ? "#0f6e56" : "#374151",
            cursor: "pointer"
          }}
        >
          All
        </button>
        {categoryItems.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              style={{
                padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 700,
                border: "1.5px solid",
                borderColor: active ? "#1d9e75" : "#d1d5db",
                background: active ? "#f0fdf9" : "#fff",
                color: active ? "#0f6e56" : "#374151",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5
              }}
            >
              <span>{CATEGORY_ICONS[cat.id] ?? "💊"}</span>
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Results heading */}
      <SectionHeading
        title={activeCategory ? `${activeCategoryLabel}` : "All Products"}
        action={loading ? "Loading…" : `${items.length} results`}
      />

      {/* Product grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 12,
        marginTop: 8
      }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : items.length === 0
            ? (
              <div style={{
                textAlign: "center", padding: "40px 20px",
                border: "2px dashed #e5e7eb", borderRadius: 20
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <strong style={{ color: "#374151" }}>No products found</strong>
                <p style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                  {search
                    ? `No results for "${search}" in ${activeCategoryLabel || "all categories"}.`
                    : `No items in ${activeCategoryLabel || "this category"} yet.`}
                </p>
                <button
                  onClick={() => { setSearch(""); setActiveCategory(""); }}
                  style={{
                    marginTop: 14, padding: "10px 20px", borderRadius: 12,
                    background: "#1d9e75", color: "#fff", border: "none",
                    fontWeight: 700, cursor: "pointer"
                  }}
                >
                  Show all products
                </button>
              </div>
            )
            : items.map((item) => (
              <MedicineCard key={item.id} item={item} onAddToCart={handleAddToCart} />
            ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </AppShell>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <AppShell activePath="/catalog" title="Browse Medicines" subtitle="Loading catalog...">
        <div style={{ padding: 20, textAlign: "center" }}>
          <p>Loading medicines...</p>
        </div>
      </AppShell>
    }>
      <CatalogContent />
    </Suspense>
  );
}
