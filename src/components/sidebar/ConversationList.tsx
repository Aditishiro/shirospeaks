
"use client";

import { useState } from "react"; // Import useState directly
import { useConversations } from "@/hooks/useConversations";
import { useAppContext } from "@/contexts/AppContext";
import { ConversationItem } from "./ConversationItem";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Loader2 } from "lucide-react";
import { LumenLogo } from "@/components/icons/LumenLogo";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversationList() {
  const { conversations, isLoadingConversations, createConversation } = useConversations();
  const { setSelectedConversationId, selectedConversationId } = useAppContext();
  const [isCreating, setIsCreating] = useState(false); // Use useState directly

  const handleNewConversation = async () => {
    setIsCreating(true);
    try {
      const newConversationId = await createConversation({ initialMessage: "" }); // Pass empty string for new convo
      setSelectedConversationId(newConversationId);
    } catch (error) {
      console.error("Failed to create new conversation:", error);
      // TODO: Show error toast
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground p-2 space-y-2">
      <div className="flex items-center justify-between p-2">
        <LumenLogo className="h-6 text-sidebar-primary" />
        <Button variant="ghost" size="icon" onClick={handleNewConversation} disabled={isCreating} aria-label="New Conversation">
          {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
        </Button>
      </div>
      <ScrollArea className="flex-grow">
        <div className="space-y-1 pr-2">
          {isLoadingConversations && (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          )}
          {!isLoadingConversations && conversations && conversations.length === 0 && (
            <p className="text-sm text-sidebar-foreground/70 p-4 text-center">No conversations yet. Start a new one!</p>
          )}
          {!isLoadingConversations && conversations && conversations.map((convo) => (
            <ConversationItem key={convo.id} conversation={convo} />
          ))}
        </div>
      </ScrollArea>
      {/* Optional Footer can go here */}
    </div>
  );
}
