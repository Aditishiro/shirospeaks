import type { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email?: string | null;
  displayName?: string | null;
}

export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai" | "system"; // 'ai' for suggestions block, 'system' for initial prompt
  timestamp: Timestamp | Date; // Store as Firestore Timestamp, allow Date for client-side creation
  feedback?: "up" | "down" | null;
  suggestions?: string[]; // For AI messages that are suggestion blocks
}

export interface Conversation {
  id: string;
  userId: string;
  summary?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  lastMessageText?: string; // For quick display in conversation list
}
