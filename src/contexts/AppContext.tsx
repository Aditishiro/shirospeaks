"use client";

import type { Conversation, Message } from "@/types";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  isAiResponding: boolean;
  setIsAiResponding: (isLoading: boolean) => void;
  // For simplicity, managing current user ID here. In a real app, this would come from an auth provider.
  currentUserId: string; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [currentUserId] = useState<string>("test-user"); // Placeholder user ID

  return (
    <AppContext.Provider
      value={{
        selectedConversationId,
        setSelectedConversationId,
        isAiResponding,
        setIsAiResponding,
        currentUserId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
