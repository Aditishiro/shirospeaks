"use client";

import { db } from "@/lib/firebase";
import type { Message } from "@/types";
import { useAppContext } from "@/contexts/AppContext";
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  onSnapshot, // For real-time updates if desired, though useQuery is simpler for now
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_COLLECTION = "messages";

export function useMessages(conversationId: string | null) {
  const { currentUserId } = useAppContext();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<Message[], Error>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId || !currentUserId) return [];
      // Basic security: ensure user owns conversation (implicitly via conversationId)
      // In a real app, you might fetch conversation doc first to verify userId.
      const messagesPath = `${CONVERSATIONS_COLLECTION}/${conversationId}/${MESSAGES_COLLECTION}`;
      const q = query(collection(db, messagesPath), orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Ensure timestamp is a Date object for client-side consistency
          timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate() : new Date(),
        } as Message;
      });
    },
    enabled: !!conversationId && !!currentUserId,
  });

  // Optional: Real-time updates using onSnapshot
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const messagesPath = `${CONVERSATIONS_COLLECTION}/${conversationId}/${MESSAGES_COLLECTION}`;
    const q = query(collection(db, messagesPath), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate() : new Date(),
        } as Message;
      });
      queryClient.setQueryData(["messages", conversationId], newMessages);
    });

    return () => unsubscribe();
  }, [conversationId, currentUserId, queryClient]);


  const addMessageMutation = useMutation<
    string, 
    Error, 
    Omit<Message, "id" | "timestamp"> & { conversationId: string }
  >(
    async (messageData) => {
      const { conversationId: targetConversationId, ...restOfMessageData } = messageData;
      if (!targetConversationId || !currentUserId) throw new Error("Conversation ID or User ID is missing");

      const messagesPath = `${CONVERSATIONS_COLLECTION}/${targetConversationId}/${MESSAGES_COLLECTION}`;
      const newMessageRef = await addDoc(collection(db, messagesPath), {
        ...restOfMessageData,
        timestamp: serverTimestamp(),
      });

      // Update conversation's lastMessageText and updatedAt
      const conversationRef = doc(db, CONVERSATIONS_COLLECTION, targetConversationId);
      await updateDoc(conversationRef, {
        lastMessageText: messageData.text ? messageData.text.substring(0, 100) : (messageData.suggestions ? "AI Suggestions" : "New Message"),
        updatedAt: serverTimestamp(),
      });
      queryClient.invalidateQueries({queryKey: ["conversations", currentUserId]});


      return newMessageRef.id;
    },
    {
      onSuccess: (data, variables) => {
         // Optimistically update or refetch, onSnapshot handles this too.
         // queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      },
    }
  );

  const updateMessageFeedbackMutation = useMutation<
    void, 
    Error, 
    { messageId: string; feedback: "up" | "down" | null; conversationId: string }
  >(
    async ({ messageId, feedback, conversationId: targetConversationId }) => {
      if (!targetConversationId || !currentUserId) throw new Error("Conversation ID or User ID is missing");

      const messagePath = `${CONVERSATIONS_COLLECTION}/${targetConversationId}/${MESSAGES_COLLECTION}/${messageId}`;
      const messageRef = doc(db, messagePath);
      await updateDoc(messageRef, { feedback });
    },
    {
      onSuccess: (data, variables) => {
        // queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      },
    }
  );

  return {
    messages: messagesQuery.data,
    isLoadingMessages: messagesQuery.isLoading,
    addMessage: addMessageMutation.mutateAsync,
    updateMessageFeedback: updateMessageFeedbackMutation.mutateAsync,
  };
}
