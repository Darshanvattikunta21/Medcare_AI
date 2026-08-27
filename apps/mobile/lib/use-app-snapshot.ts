import { fetchAppSnapshot, getFallbackSnapshot, type AppSnapshot } from "@medicare/api-client";
import React, { createContext, useContext, useEffect, useState } from "react";

type AppSnapshotContextType = {
  snapshot: AppSnapshot;
  loading: boolean;
  refetch: () => Promise<void>;
};

const AppSnapshotContext = createContext<AppSnapshotContextType>({
  snapshot: getFallbackSnapshot(),
  loading: true,
  refetch: async () => {},
});

export function AppSnapshotProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(getFallbackSnapshot());
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      const nextSnapshot = await fetchAppSnapshot();
      setSnapshot(nextSnapshot);
    } catch (err) {
      console.error("Failed to fetch app snapshot:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
  }, []);

  return React.createElement(
    AppSnapshotContext.Provider,
    { value: { snapshot, loading, refetch } },
    children
  );
}

export function useAppSnapshot() {
  return useContext(AppSnapshotContext);
}

