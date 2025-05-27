"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useMessages } from "@/hooks/useMessages";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle } from "lucide-react";
import { generateInitialPrompt } from "@/ai/flows/generate-initial-prompt";
import { suggestFollowUpActions } from "@/ai/flows/suggest-follow-up-actions";
import { summarizeConversation } from "@/ai/flows/summarize-conversation";
import { useConversations } from "@/hooks/useConversations";
import type { Message as MessageType } from "@/types";

export function ChatView() {
  const {
    selectedConversationId,
    isAiResponding,
    setIsAiResponding,
    currentUserId,
  } = useAppContext();
  const { messages, isLoadingMessages, addMessage } = useMessages(selectedConversationId);
  const { updateConversation } = useConversations();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle initial prompt for new or empty selected conversations
  useEffect(() => {
    const setupInitialPrompt = async () => {
      if (selectedConversationId && (!messages || messages.length === 0) && !isLoadingMessages) {
        setIsAiResponding(true);
        try {
          const initialPromptData = await generateInitialPrompt();
          if (initialPromptData?.prompt) {
            await addMessage({
              conversationId: selectedConversationId,
              text: initialPromptData.prompt,
              sender: "system",
            });
          }
        } catch (error) {
          console.error("Failed to get initial prompt:", error);
          // Add a fallback system message
           await addMessage({
              conversationId: selectedConversationId,
              text: "Hello! How can I assist you today?",
              sender: "system",
            });
        } finally {
          setIsAiResponding(false);
        }
      }
    };
    setupInitialPrompt();
  }, [selectedConversationId, messages, isLoadingMessages, addMessage, setIsAiResponding]);

  const handleSendMessage = async (messageText: string) => {
    if (!selectedConversationId || !messageText.trim()) return;

    setIsAiResponding(true);
    try {
      // Add user message
      await addMessage({
        conversationId: selectedConversationId,
        text: messageText,
        sender: "user",
      });

      // Construct conversation history for AI
      const conversationHistory = (messages ?? [])
        .concat([{ text: messageText, sender: "user", id: "temp", timestamp: new Date() }]) // Add current message
        .map(msg => `${msg.sender === "user" ? "User" : "AI"}: ${msg.text || (msg.suggestions ? msg.suggestions.join(', ') : '')}`)
        .join("\n");
      
      const followUpActionsData = await suggestFollowUpActions({ conversationHistory });

      if (followUpActionsData?.suggestedActions && followUpActionsData.suggestedActions.length > 0) {
        await addMessage({
          conversationId: selectedConversationId,
          text: "", // AI message is the suggestions themselves
          sender: "ai",
          suggestions: followUpActionsData.suggestedActions,
        });
      } else {
         await addMessage({
          conversationId: selectedConversationId,
          text: "I'm not sure how to respond to that. Here are some general things you can try:",
          sender: "ai",
          suggestions: ["Check account balance", "View transaction history", "Contact support"], // Fallback suggestions
        });
      }
      
      // Summarize conversation for update
      const updatedHistoryForSummary = conversationHistory + 
        (followUpActionsData?.suggestedActions ? `\nAI: ${followUpActionsData.suggestedActions.join(', ')}` : '');
        
      const summaryData = await summarizeConversation({ conversationHistory: updatedHistoryForSummary });
      if (summaryData?.summary) {
        await updateConversation({ id: selectedConversationId, summary: summaryData.summary });
      }

    } catch (error) {
      console.error("Error in chat flow:", error);
       await addMessage({
        conversationId: selectedConversationId,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
      });
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };


  if (!selectedConversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Welcome to LUMEN</h2>
        <p className="text-muted-foreground">Select a conversation or start a new one to begin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {isLoadingMessages && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {!isLoadingMessages && messages && messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onSuggestionClick={handleSuggestionClick} />
        ))}
        {isAiResponding && !isLoadingMessages && ( // Show AI typing indicator only if not initial loading
           <div className="flex items-start space-x-3 py-3 justify-start">
             <Loader2 className="h-5 w-5 animate-spin text-primary mt-1" />
             <span className="text-sm text-muted-foreground">LUMEN is thinking...</span>
           </div>
        )}
      </ScrollArea>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
    </div>
  );
}
