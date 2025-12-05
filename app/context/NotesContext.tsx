"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Note {
  id: string;
  timestamp: Date;
  title: string;
  messages: string[];
  read: boolean;
  branchName?: string;
  repoName?: string;
}

interface NotesContextType {
  notes: Note[];
  unreadCount: number;
  addNote: (note: Omit<Note, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotes: () => void;
}

const NotesContext = createContext<NotesContextType | null>(null);

/**
 * Provides app-wide notes/notifications state.
 * 
 * @param children - Child components that will have access to the notes context
 */
export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = useCallback((noteData: Omit<Note, "id" | "timestamp" | "read">) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotes((prev) => [newNote, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, read: true } : note))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotes((prev) => prev.map((note) => ({ ...note, read: true })));
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  const unreadCount = notes.filter((n) => !n.read).length;

  return (
    <NotesContext.Provider
      value={{ notes, unreadCount, addNote, markAsRead, markAllAsRead, clearNotes }}
    >
      {children}
    </NotesContext.Provider>
  );
}

/**
 * Hook to access the notes context.
 * 
 * @returns NotesContextType with notes state and actions
 * @throws Error if used outside of NotesProvider
 */
export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}

