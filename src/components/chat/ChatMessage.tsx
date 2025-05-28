
"use client";

import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, User, Cat } from "lucide-react";
import { format } from 'date-fns';
import { useMessages } from "@/hooks/useMessages";
import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import React, { useEffect, useState } from "react";

interface ChatMessageProps {
  message: Message;
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const { selectedConversationId } = useAppContext();
  const { updateMessageFeedback } = useMessages(selectedConversationId);
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";
  const [formattedTimestamp, setFormattedTimestamp] = useState<string>("");

  useEffect(() => {
    if (message.timestamp) {
      try {
        const dateToFormat = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp as any);
        if (!isNaN(dateToFormat.getTime())) {
          setFormattedTimestamp(format(dateToFormat, "p"));
        } else {
          setFormattedTimestamp("");
        }
      } catch (e) {
        console.error("Error formatting timestamp:", e);
        setFormattedTimestamp("");
      }
    }
  }, [message.timestamp]);

  const handleFeedback = async (feedback: "up" | "down") => {
    if (!selectedConversationId) return;
    try {
      await updateMessageFeedback({
        messageId: message.id,
        feedback,
        conversationId: selectedConversationId,
      });
    } catch (error) {
      console.error("Failed to update feedback:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start space-x-3 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Cat size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          "max-w-[70%] rounded-xl p-0 shadow-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card/60 dark:bg-zinc-800/60 backdrop-blur-md border border-border/30 dark:border-zinc-700/50 text-card-foreground",
          isSystem ? "bg-accent/30 border-accent/50" : ""
        )}
      >
        <CardContent className="p-3">
          {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}

          {message.sender === "ai" && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-sm font-medium mb-1">Here are some suggestions:</p>
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left bg-card hover:bg-accent/20"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </CardContent>

        {(message.sender === "ai" || isSystem || isUser) && (
          <CardFooter className="px-3 py-1 justify-end items-center">
            <span className="text-xs text-muted-foreground mr-2">
              {formattedTimestamp || ""}
            </span>
            {message.sender === "ai" && (
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-6 w-6", message.feedback === "up" ? "text-accent-foreground bg-accent/50" : "text-muted-foreground")}
                  onClick={() => handleFeedback("up")}
                >
                  <ThumbsUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-6 w-6", message.feedback === "down" ? "text-destructive" : "text-muted-foreground")}
                  onClick={() => handleFeedback("down")}
                >
                  <ThumbsDown size={14} />
                </Button>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
      {isUser && (
         <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
