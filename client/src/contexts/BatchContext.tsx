import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Folder } from "@shared/schema";

interface BatchContextType {
  selectedBatch: Folder | null;
  setSelectedBatch: (batch: Folder | null) => void;
  clearBatch: () => void;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export function BatchProvider({ children }: { children: ReactNode }) {
  const [selectedBatch, setSelectedBatchState] = useState<Folder | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selectedBatch");
    if (stored) {
      try {
        setSelectedBatchState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("selectedBatch");
      }
    }
  }, []);

  const setSelectedBatch = (batch: Folder | null) => {
    setSelectedBatchState(batch);
    if (batch) {
      localStorage.setItem("selectedBatch", JSON.stringify(batch));
    } else {
      localStorage.removeItem("selectedBatch");
    }
  };

  const clearBatch = () => {
    setSelectedBatchState(null);
    localStorage.removeItem("selectedBatch");
  };

  return (
    <BatchContext.Provider value={{ selectedBatch, setSelectedBatch, clearBatch }}>
      {children}
    </BatchContext.Provider>
  );
}

export function useBatch() {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error("useBatch must be used within BatchProvider");
  }
  return context;
}
