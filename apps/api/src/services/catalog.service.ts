import { env } from "../config/env";
import { categories, medicines } from "@medicare/core";
import { getMedicineDb, listCategoriesDb, listMedicinesDb } from "./database.service";
import { readDb } from "../lib/file-db";

function enrichMedicine<T extends (typeof medicines)[number]>(
  item: T,
  stocks?: Record<string, "in_stock" | "out_of_stock" | "limited">
) {
  const customStock = stocks?.[item.id];
  return {
    ...item,
    prescriptionRequired: item.tag.toLowerCase() === "rx",
    stockStatus: customStock || (item.tag.toLowerCase() === "rx" ? "limited" : "in_stock")
  };
}

export function listCategories() {
  if (env.useDatabase) {
    return listCategoriesDb();
  }

  return categories;
}

export async function listMedicines(filters?: {
  q?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "price-asc" | "price-desc";
}) {
  if (env.useDatabase) {
    return listMedicinesDb(filters);
  }

  const db = readDb();
  const stocks = db.medicineStocks ?? {};

  const q = String(filters?.q ?? "").trim().toLowerCase();
  const category = String(filters?.category ?? "").trim().toLowerCase();
  const tag = String(filters?.tag ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(filters?.page ?? 1));
  const limit = Math.max(1, Math.min(50, Number(filters?.limit ?? 20)));

  let filtered = medicines.filter((item) => {
    const matchesQuery =
      !q ||
      [item.name, item.brand, item.description, item.category, item.tag].some((field) =>
        field.toLowerCase().includes(q)
      );
    const matchesCategory = !category || item.category.toLowerCase() === category;
    const matchesTag = !tag || item.tag.toLowerCase() === tag;

    return matchesQuery && matchesCategory && matchesTag;
  });

  if (filters?.sort === "name") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (filters?.sort === "price-asc" || filters?.sort === "price-desc") {
    filtered = [...filtered].sort((a, b) => {
      const first = Number(a.price.replace(/[^0-9.]/g, ""));
      const second = Number(b.price.replace(/[^0-9.]/g, ""));
      return filters.sort === "price-asc" ? first - second : second - first;
    });
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;

  return {
    items: filtered.slice(offset, offset + limit).map((item) => enrichMedicine(item, stocks)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

export async function getMedicine(id: string) {
  if (env.useDatabase) {
    return getMedicineDb(id);
  }

  const db = readDb();
  const stocks = db.medicineStocks ?? {};
  const medicine = medicines.find((item) => item.id === id) ?? null;
  return medicine ? enrichMedicine(medicine, stocks) : null;
}

