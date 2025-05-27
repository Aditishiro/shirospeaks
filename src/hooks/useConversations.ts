
"use client";

import { db } from "@/lib/firebase";
import type { Conversation } from "@/types";
import { useAppContext } from "@/contexts/AppContext";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CONVERSATIONS_COLLECTION = "conversations";

export function useConversations() {
  const { currentUserId } = useAppContext();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery<Conversation[], Error>({
    queryKey: ["conversations", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const q = query(
        collection(db, CONVERSATIONS_COLLECTION),
        where("userId", "==", currentUserId),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
    },
    enabled: !!currentUserId,
  });

  const createConversationMutation = useMutation<
    string, // TData (return type of mutationFn)
    Error,  // TError
    { initialMessage?: string } // TVariables
  >({
    mutationFn: async ({ initialMessage }) => {
      if (!currentUserId) throw new Error("User not authenticated");
      const newConversationRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
        userId: currentUserId,
        summary: initialMessage ? `Regarding: "${initialMessage.substring(0,50)}..."` : "New Conversation",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageText: initialMessage || "",
      });
      return newConversationRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["conversations", currentUserId]});
    },
  });

  const updateConversationMutation = useMutation<
    void, // TData
    Error, // TError
    Partial<Conversation> & { id: string } // TVariables
  >({
    mutationFn: async (conversationData) => {
      if (!currentUserId) throw new Error("User not authenticated");
      const { id, ...dataToUpdate } = conversationData;
      const conversationRef = doc(db, CONVERSATIONS_COLLECTION, id);
      await updateDoc(conversationRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ["conversations", currentUserId]});
      queryClient.invalidateQueries({queryKey: ["conversation", variables.id]});
    },
  });
  
  const deleteConversationMutation = useMutation<
    void,   // TData
    Error,  // TError
    string  // TVariables (conversationId)
  >({
    mutationFn: async (conversationId) => {
      // Note: This does not delete subcollections (messages). 
      // For a production app, use a Firebase Function to delete subcollections.
      const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
      await deleteDoc(conversationRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["conversations", currentUserId]});
    },
  });


  return {
    conversations: conversationsQuery.data,
    isLoadingConversations: conversationsQuery.isLoading,
    createConversation: createConversationMutation.mutateAsync,
    updateConversation: updateConversationMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,
  };
}
