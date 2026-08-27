import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchCart,
  fetchMedicine,
  addCartItem as apiAddCartItem,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  getErrorMessage
} from "@medicare/api-client";
import { useAuth } from "./use-auth";

export type CartItem = {
  medicineId: string;
  name: string;
  brand: string;
  price: string;
  quantity: number;
  lineTotal: string;
  prescriptionRequired: boolean;
};

type CartContextType = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  loading: boolean;
  networkError: boolean;
  addItem: (medicine: { id: string; name: string; brand: string; price: string; tag: string }, quantity?: number) => Promise<void>;
  addItemsByIds: (catalogIds: string[]) => Promise<{ added: number; skipped: number }>;
  removeItem: (medicineId: string) => Promise<void>;
  updateQuantity: (medicineId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  dismissNetworkError: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  subtotal: 0,
  deliveryFee: 30,
  total: 30,
  itemCount: 0,
  loading: false,
  networkError: false,
  addItem: async () => {},
  addItemsByIds: async () => ({ added: 0, skipped: 0 }),
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
  dismissNetworkError: () => {}
});

const CART_KEY = "medicare_cart_data";

function parsePrice(str: string): number {
  const clean = str.replace(/[^0-9.]/g, "");
  return Number(clean || 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [deliveryFee] = useState(30);

  // Restore cart from AsyncStorage on launch, then sync from backend
  useEffect(() => {
    async function restoreCart() {
      try {
        const cached = await AsyncStorage.getItem(CART_KEY);
        if (cached) {
          setItems(JSON.parse(cached) as CartItem[]);
        }
      } catch {
        // Cache read failure is non-critical — cart starts empty
      }

      if (token) {
        setLoading(true);
        try {
          const cartData = await fetchCart();
          setItems(cartData.items);
          try {
            await AsyncStorage.setItem(CART_KEY, JSON.stringify(cartData.items));
          } catch {
            // AsyncStorage write failure is non-critical
          }
        } catch (err) {
          const msg = getErrorMessage(err, "");
          const isNetwork =
            err instanceof Error &&
            (msg.includes("Network") || msg.includes("fetch") || msg.includes("timeout"));
          if (isNetwork) setNetworkError(true);
          // Cart continues to work from local cache
        } finally {
          setLoading(false);
        }
      }
    }
    restoreCart();
  }, [token]);

  const saveCartLocally = useCallback(async (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
    } catch {
      // Persist failure is non-critical; in-memory state remains accurate
    }
  }, []);

  const addItem = useCallback(
    async (
      medicine: { id: string; name: string; brand: string; price: string; tag: string },
      quantity = 1
    ) => {
      const existingIndex = items.findIndex((i) => i.medicineId === medicine.id);
      let newItems = [...items];

      if (existingIndex > -1) {
        const existingItem = newItems[existingIndex];
        const newQty = existingItem.quantity + quantity;
        newItems[existingIndex] = {
          ...existingItem,
          quantity: newQty,
          lineTotal: `Rs ${parsePrice(existingItem.price) * newQty}`
        };
      } else {
        newItems.push({
          medicineId: medicine.id,
          name: medicine.name,
          brand: medicine.brand,
          price: medicine.price,
          quantity,
          lineTotal: `Rs ${parsePrice(medicine.price) * quantity}`,
          prescriptionRequired: medicine.tag.toLowerCase() === "rx"
        });
      }

      const backupItems = [...items];
      await saveCartLocally(newItems);

      if (token) {
        try {
          await apiAddCartItem({ medicineId: medicine.id, quantity });
        } catch {
          // Revert optimistic update on sync failure
          await saveCartLocally(backupItems);
          throw new Error("Failed to sync cart item with server. Please check your connection.");
        }
      }
    },
    [items, token, saveCartLocally]
  );

  /**
   * Bulk-adds medicines to the cart by catalog ID.
   * Fetches each medicine from the API, then calls addItem.
   * Used after a successful prescription OCR verification.
   * Returns counts of added and skipped items.
   */
  const addItemsByIds = useCallback(
    async (catalogIds: string[]): Promise<{ added: number; skipped: number }> => {
      let added = 0;
      let skipped = 0;

      await Promise.allSettled(
        catalogIds.map(async (catalogId) => {
          try {
            const medicine = await fetchMedicine(catalogId);
            await addItem(
              {
                id: medicine.id,
                name: medicine.name,
                brand: medicine.brand,
                price: medicine.price,
                tag: medicine.tag
              },
              1
            );
            added++;
          } catch {
            skipped++;
          }
        })
      );

      return { added, skipped };
    },
    [addItem]
  );

  const removeItem = useCallback(
    async (medicineId: string) => {
      const backupItems = [...items];
      const newItems = items.filter((i) => i.medicineId !== medicineId);
      await saveCartLocally(newItems);

      if (token) {
        try {
          await apiRemoveCartItem(medicineId);
        } catch {
          await saveCartLocally(backupItems);
          throw new Error("Failed to remove item. Please check your connection.");
        }
      }
    },
    [items, token, saveCartLocally]
  );

  const updateQuantity = useCallback(
    async (medicineId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(medicineId);
        return;
      }

      const backupItems = [...items];
      const newItems = items.map((item) => {
        if (item.medicineId === medicineId) {
          return {
            ...item,
            quantity,
            lineTotal: `Rs ${parsePrice(item.price) * quantity}`
          };
        }
        return item;
      });

      await saveCartLocally(newItems);

      if (token) {
        try {
          await apiUpdateCartItem(medicineId, { quantity });
        } catch {
          await saveCartLocally(backupItems);
          throw new Error("Failed to update quantity. Please check your connection.");
        }
      }
    },
    [items, token, saveCartLocally, removeItem]
  );

  const clearCart = useCallback(async () => {
    await saveCartLocally([]);
  }, [saveCartLocally]);

  const refreshCart = useCallback(async () => {
    if (!token) return;
    setNetworkError(false);
    try {
      const cartData = await fetchCart();
      setItems(cartData.items);
      try {
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(cartData.items));
      } catch {
        // Non-critical
      }
    } catch (err) {
      const msg = getErrorMessage(err, "");
      const isNetwork =
        err instanceof Error &&
        (msg.includes("Network") || msg.includes("fetch") || msg.includes("timeout"));
      if (isNetwork) setNetworkError(true);
    }
  }, [token]);

  const dismissNetworkError = useCallback(() => setNetworkError(false), []);

  const subtotal = items.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0
  );
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        deliveryFee,
        total,
        itemCount,
        loading,
        networkError,
        addItem,
        addItemsByIds,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
        dismissNetworkError
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
