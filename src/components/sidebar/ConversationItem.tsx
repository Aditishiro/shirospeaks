"use client";

import type { Conversation } from "@/types";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useConversations } from "@/hooks/useConversations"; // For delete

interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { selectedConversationId, setSelectedConversationId } = useAppContext();
  const { deleteConversation } = useConversations();
  const isActive = selectedConversationId === conversation.id;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting conversation when deleting
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation(conversation.id);
        if (isActive) {
          setSelectedConversationId(null); // Deselect if current one is deleted
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error);
        // Potentially show a toast message here
      }
    }
  };
  
  const getDisplayText = () => {
    if (conversation.summary) return conversation.summary;
    if (conversation.lastMessageText) return conversation.lastMessageText;
    return "New Conversation";
  }

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start h-auto py-2 px-3 text-left group",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      onClick={() => setSelectedConversationId(conversation.id)}
    >
      <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
      <div className="flex flex-col flex-grow overflow-hidden">
        <span className="text-sm font-medium truncate">
          {getDisplayText()}
        </span>
        <span className="text-xs text-muted-foreground">
          {conversation.updatedAt && formatDistanceToNow(
            (conversation.updatedAt as Timestamp)?.toDate ? (conversation.updatedAt as Timestamp).toDate() : new Date(conversation.updatedAt), 
            { addSuffix: true }
          )}
        </span>
      </div>
       <Trash2 
        className="h-4 w-4 ml-2 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        onClick={handleDelete}
        aria-label="Delete conversation"
      />
    </Button>
  );
}
