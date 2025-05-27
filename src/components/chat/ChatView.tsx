
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useMessages } from "@/hooks/useMessages";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle, Bot } from "lucide-react";
import { generateAiResponse } from "@/ai/flows/generate-ai-response";
import { summarizeConversation } from "@/ai/flows/summarize-conversation";
import { useConversations } from "@/hooks/useConversations";
import type { Message as MessageType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AI_RESPONSE_TIMEOUT_MS = 30000; // 30 seconds

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
  const aiResponseAbortControllerRef = useRef<AbortController | null>(null);

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

  const handleSendMessage = async (messageText: string) => {
    if (!selectedConversationId || !messageText.trim()) return;

    setIsAiResponding(true);
    if (aiResponseAbortControllerRef.current) {
      aiResponseAbortControllerRef.current.abort(); // Abort previous request if any
    }
    aiResponseAbortControllerRef.current = new AbortController();
    const signal = aiResponseAbortControllerRef.current.signal;

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
      const MAX_HISTORY_FOR_PROMPT = 10; 
      const recentMessagesForPrompt = currentMessages.slice(-MAX_HISTORY_FOR_PROMPT);

      const conversationHistoryForPrompt = recentMessagesForPrompt
        .concat([userMessageForHistory])
        .map(msg => `${msg.sender === "user" ? "User" : (msg.sender === "system" ? "System" : "AI")}: ${msg.text || ''}`)
        .join("\n");

      const aiResponsePromise = generateAiResponse({ 
        conversationHistory: conversationHistoryForPrompt, 
        currentMessage: messageText 
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI response timeout')), AI_RESPONSE_TIMEOUT_MS)
      );
      
      let aiResponseData;
      try {
        // @ts-ignore
        aiResponseData = await Promise.race([aiResponsePromise, timeoutPromise]);
         if (signal.aborted) {
          console.log("AI response aborted by new message send");
          return; // Don't process if aborted
        }
      } catch (raceError: any) {
        if (raceError.message === 'AI response timeout') {
          console.error("AI response timed out.");
          await addMessage({
            conversationId: selectedConversationId,
            text: "Sorry, I'm taking too long to respond. Please try again.",
            sender: "ai",
          });
        } else {
           console.error("Error in generateAiResponse race:", raceError);
           await addMessage({
            conversationId: selectedConversationId,
            text: "Sorry, I encountered an error. Please try again.",
            sender: "ai",
          });
        }
        setIsAiResponding(false);
        return;
      }


      if (!aiResponseData || !aiResponseData.responseText) {
        console.warn("Received empty or invalid AI response data:", aiResponseData);
        await addMessage({
          conversationId: selectedConversationId,
          text: "I seem to be having trouble. Could you try again?",
          sender: "ai",
        });
        setIsAiResponding(false);
        return;
      }
      
      await addMessage({
        conversationId: selectedConversationId,
        text: aiResponseData.responseText,
        sender: "ai",
      });

      const aiMessageForSummary: MessageType = {
        id: Date.now().toString() + "_ai",
        text: aiResponseData.responseText,
        sender: "ai",
        timestamp: new Date(),
      };
      const updatedMessagesForSummary = currentMessages.concat([userMessageForHistory, aiMessageForSummary]);
      const fullHistoryForSummary = updatedMessagesForSummary
         .map(msg => `${msg.sender === "user" ? "User" : (msg.sender === "system" ? "System" : "AI")}: ${msg.text || ''}`)
        .join("\n");

      if (selectedConversationId) {
        summarizeConversation({ conversationHistory: fullHistoryForSummary })
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
      if (selectedConversationId) { // Ensure selectedConversationId is still valid
         await addMessage({
            conversationId: selectedConversationId,
            text: "Sorry, I encountered an error. Please try again.",
            sender: "ai",
          });
      }
    } finally {
      setIsAiResponding(false);
      aiResponseAbortControllerRef.current = null;
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

  if (!isLoadingMessages && selectedConversationId && messages && messages.length === 0 && !isAiResponding) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <Bot className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chat is Empty</h2>
          <p className="text-muted-foreground">Type your message below to start the conversation.</p>
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
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
         (messages && messages.length > 0 && messages[messages.length -1]?.sender === 'user') && (
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
