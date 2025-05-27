"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useMessages } from "@/hooks/useMessages";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle } from "lucide-react";
import { generateInitialPrompt } from "@/ai/flows/generate-initial-prompt";
import { generateAiResponse } from "@/ai/flows/generate-ai-response"; // Updated import
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

  useEffect(() => {
    const setupInitialPrompt = async () => {
      if (selectedConversationId && (!messages || messages.length === 0) && !isLoadingMessages && !isAiResponding) {
        setIsAiResponding(true);
        try {
          const initialPromptData = await generateInitialPrompt();
          if (initialPromptData?.prompt) {
            await addMessage({
              conversationId: selectedConversationId,
              text: initialPromptData.prompt,
              sender: "system",
              // Optionally, add hardcoded suggestions for the initial system prompt
              // suggestions: ["What can you do?", "Help me with my finances"],
            });
          }
        } catch (error) {
          console.error("Failed to get initial prompt:", error);
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
  }, [selectedConversationId, messages, isLoadingMessages, addMessage, setIsAiResponding, isAiResponding]);

  const handleSendMessage = async (messageText: string) => {
    if (!selectedConversationId || !messageText.trim()) return;

    setIsAiResponding(true);
    const userMessageId = Date.now().toString(); // temp ID for optimistic update
    const userMessageForHistory: MessageType = {
      id: userMessageId,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    try {
      await addMessage({
        conversationId: selectedConversationId,
        text: messageText,
        sender: "user",
      });
      
      // Construct conversation history for AI
      // Use the current messages state + the new user message for the most up-to-date history
      const currentMessages = messages ?? [];
      const conversationHistory = currentMessages
        .concat([userMessageForHistory]) 
        .map(msg => `${msg.sender === "user" ? "User" : (msg.sender === "system" ? "System" : "AI")}: ${msg.text || (msg.suggestions ? msg.suggestions.join(', ') : '')}`)
        .join("\n");
      
      const aiResponseData = await generateAiResponse({ conversationHistory, currentMessage: messageText });
      
      await addMessage({
        conversationId: selectedConversationId,
        text: aiResponseData.responseText,
        sender: "ai",
        suggestions: aiResponseData.suggestedActions,
      });
      
      // Decoupled Summarization:
      // Create a snapshot of messages *after* AI response for summary
      const aiMessageForHistory: MessageType = {
        id: Date.now().toString() + "_ai", // temp ID
        text: aiResponseData.responseText,
        sender: "ai",
        suggestions: aiResponseData.suggestedActions,
        timestamp: new Date(),
      };
      const updatedMessagesForSummary = currentMessages.concat([userMessageForHistory, aiMessageForHistory]);
      const historyForSummary = updatedMessagesForSummary
         .map(msg => `${msg.sender === "user" ? "User" : (msg.sender === "system" ? "System" : "AI")}: ${msg.text || (msg.suggestions ? msg.suggestions.join(', ') : '')}`)
        .join("\n");

      if (selectedConversationId) { // Ensure ID is still valid
        summarizeConversation({ conversationHistory: historyForSummary })
          .then(summaryData => {
            if (summaryData?.summary && selectedConversationId) { // Re-check selectedConversationId in case it changed
              updateConversation({ id: selectedConversationId, summary: summaryData.summary, lastMessageText: aiResponseData.responseText.substring(0,100) });
            }
          })
          .catch(error => {
            console.error("Error summarizing conversation in background:", error);
          });
      }


    } catch (error) {
      console.error("Error in chat flow:", error);
       await addMessage({
        conversationId: selectedConversationId,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
      });
    } finally {
      setIsAiResponding(false); // Unlock input after primary response
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };


  if (!selectedConversationId && !isLoadingMessages) { // Added !isLoadingMessages to prevent flicker if conversations load slowly
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Welcome to LUMEN</h2>
        <p className="text-muted-foreground">Select a conversation or start a new one to begin.</p>
      </div>
    );
  }
  
  if (isLoadingMessages && !messages?.length) { // Show loader only if messages are truly loading for the first time
     return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-2">Loading conversation...</p>
        </div>
     );
  }


  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {messages && messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onSuggestionClick={handleSuggestionClick} />
        ))}
        {isAiResponding && ( 
           <div className="flex items-start space-x-3 py-3 justify-start pl-10"> {/* Aligned with AI messages */}
             <Loader2 className="h-5 w-5 animate-spin text-primary mt-1" />
             <span className="text-sm text-muted-foreground">LUMEN is thinking...</span>
           </div>
        )}
      </ScrollArea>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
    </div>
  );
}
