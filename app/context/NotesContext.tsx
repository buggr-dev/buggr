"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface NotesContextType {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const NotesContext = createContext<NotesContextType | null>(null);

/**
 * Provides panel visibility state for the notifications panel.
 * All notification data is managed by React Query hooks.
 * 
 * @param children - Child components that will have access to the context
 */
export function NotesProvider({ children }: { children: ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  return (
    <NotesContext.Provider value={{ isPanelOpen, openPanel, closePanel }}>
      {children}
    </NotesContext.Provider>
  );
}

/**
 * Hook to access the notes panel state.
 * 
 * @returns Panel visibility state and controls
 * @throws Error if used outside of NotesProvider
 */
export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
