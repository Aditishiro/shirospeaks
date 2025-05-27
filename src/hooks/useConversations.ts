
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
    string,
    Error,
    { initialMessage?: string }
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
    onSuccess: (newConversationId, variables) => {
      // Invalidate to refetch in the background for eventual consistency
      queryClient.invalidateQueries({ queryKey: ["conversations", currentUserId] });

      // Optimistically update the conversation list
      const newConversationOptimistic: Conversation = {
        id: newConversationId,
        userId: currentUserId,
        summary: variables.initialMessage ? `Regarding: "${variables.initialMessage.substring(0,50)}..."` : "New Conversation",
        createdAt: new Date(), // Use client date for optimistic, server will overwrite
        updatedAt: new Date(), // Use client date for optimistic, server will overwrite
        lastMessageText: variables.initialMessage || "New Conversation",
      };

      queryClient.setQueryData<Conversation[]>(["conversations", currentUserId], (oldData) => {
        if (oldData) {
          return [newConversationOptimistic, ...oldData];
        }
        return [newConversationOptimistic];
      });
    },
    // onError: (error, variables, context) => {
    //   // Optionally revert optimistic update if needed, or show error toast
    //   // queryClient.setQueryData(['conversations', currentUserId], context.previousConversations);
    // },
    // onSettled: () => {
    //   // Ensure to refetch eventually regardless of success/error of mutation
    //   // queryClient.invalidateQueries({ queryKey: ["conversations", currentUserId] });
    // }
  });

  const updateConversationMutation = useMutation<
    void,
    Error,
    Partial<Conversation> & { id: string }
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
      queryClient.invalidateQueries({queryKey: ["conversation", variables.id]}); // If you have a query for single conversation
    },
  });
  
  const deleteConversationMutation = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: async (conversationId) => {
      const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
      await deleteDoc(conversationRef);
      // Note: This does not delete subcollections (messages). 
      // For a production app, use a Firebase Function to delete subcollections.
    },
    onSuccess: (data, conversationId) => {
      queryClient.invalidateQueries({queryKey: ["conversations", currentUserId]});
      // Optimistically remove the conversation from the list
      queryClient.setQueryData<Conversation[]>(["conversations", currentUserId], (oldData) => 
        oldData ? oldData.filter(c => c.id !== conversationId) : []
      );
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
