
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useMessages } from "@/hooks/useMessages";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle, Bot } from "lucide-react"; // Added Bot
import { generateInitialPrompt } from "@/ai/flows/generate-initial-prompt";
import { generateAiResponse } from "@/ai/flows/generate-ai-response";
import { summarizeConversation } from "@/ai/flows/summarize-conversation";
import { useConversations } from "@/hooks/useConversations";
import type { Message as MessageType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


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

  // Effect to load initial system prompt for an empty, selected conversation
  useEffect(() => {
    const setupInitialPrompt = async () => {
      if (
        selectedConversationId &&
        messages && // Ensure messages array is available (i.e., query has resolved)
        messages.length === 0 &&
        !isLoadingMessages && // Ensure messages are not currently being loaded
        !isAiResponding // Ensure another AI operation isn't in progress
      ) {
        // Check if a system prompt already exists to prevent duplicates
        const hasSystemMessage = messages.some(msg => msg.sender === 'system');
        if (hasSystemMessage) {
          return;
        }

        setIsAiResponding(true);
        try {
          const initialPromptData = await generateInitialPrompt();
          if (initialPromptData?.prompt) {
            await addMessage({
              conversationId: selectedConversationId,
              text: initialPromptData.prompt,
              sender: "system",
            });
          } else {
            // Fallback if prompt is empty or null
            await addMessage({
              conversationId: selectedConversationId,
              text: "Hello! How can I help you today?", 
              sender: "system",
            });
          }
        } catch (error) {
          console.error("Failed to get initial prompt:", error);
           await addMessage({
              conversationId: selectedConversationId,
              text: "Hello! How can I assist you today?", // Fallback prompt on error
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
    const userMessageId = Date.now().toString(); 
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
      
      const aiMessageForHistory: MessageType = {
        id: Date.now().toString() + "_ai", 
        text: aiResponseData.responseText,
        sender: "ai",
        suggestions: aiResponseData.suggestedActions,
        timestamp: new Date(),
      };
      const updatedMessagesForSummary = currentMessages.concat([userMessageForHistory, aiMessageForHistory]);
      const historyForSummary = updatedMessagesForSummary
         .map(msg => `${msg.sender === "user" ? "User" : (msg.sender === "system" ? "System" : "AI")}: ${msg.text || (msg.suggestions ? msg.suggestions.join(', ') : '')}`)
        .join("\n");

      if (selectedConversationId) { 
        summarizeConversation({ conversationHistory: historyForSummary })
          .then(summaryData => {
            if (summaryData?.summary && selectedConversationId) { 
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
      setIsAiResponding(false); 
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  if (!selectedConversationId && !isLoadingMessages) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Welcome to LUMEN</h2>
        <p className="text-muted-foreground">Select a conversation or start a new one to begin.</p>
      </div>
    );
  }
  
  if (isLoadingMessages && (!messages || messages.length === 0)) { 
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
        {isAiResponding && 
         (!messages || messages.length === 0 || (messages[messages.length -1]?.sender !== 'ai' && messages[messages.length -1]?.sender !== 'system')) && ( 
           <div className="flex items-start space-x-3 py-3 justify-start">
             <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </AvatarFallback>
             </Avatar>
             <div className="bg-card text-card-foreground p-3 rounded-xl shadow-md max-w-[70%]">
                <p className="text-sm text-muted-foreground">LUMEN is thinking...</p>
             </div>
           </div>
        )}
      </ScrollArea>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
    </div>
  );
}
