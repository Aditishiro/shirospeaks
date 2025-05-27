
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

const AI_RESPONSE_TIMEOUT_MS = 30000; // 30 seconds client-side timeout

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
    if (!selectedConversationId || !messageText.trim() || isAiResponding) return;

    setIsAiResponding(true);
    if (aiResponseAbortControllerRef.current) {
      aiResponseAbortControllerRef.current.abort(); 
    }
    aiResponseAbortControllerRef.current = new AbortController();
    const signal = aiResponseAbortControllerRef.current.signal;

    const userMessageForHistory: MessageType = { 
      id: Date.now().toString(),
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

      const aiResponsePromise = generateAiResponse({ 
        currentMessage: messageText 
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => {
          console.warn('[ChatView] Client-side AI response timeout triggered.');
          reject(new Error('AI_RESPONSE_CLIENT_TIMEOUT'));
        }, AI_RESPONSE_TIMEOUT_MS)
      );
      
      let aiResponseData;
      try {
        console.log('[ChatView] Waiting for AI response or client timeout...');
        // @ts-ignore
        aiResponseData = await Promise.race([aiResponsePromise, timeoutPromise]);
        
        if (signal.aborted) {
          console.log("[ChatView] AI response aborted by new message send or component unmount.");
          // No setIsAiResponding(false) here, finally block handles it if this was the active request
          return; 
        }
        console.log('[ChatView] Promise.race settled. AI Response Data:', aiResponseData);

      } catch (raceError: any) {
        console.error("[ChatView] Error in Promise.race or AI flow call:", raceError.message, raceError.name);
        let fallbackMessage = "Sorry, I encountered an error. Please try again.";
        if (raceError.message === 'AI_RESPONSE_CLIENT_TIMEOUT') {
          fallbackMessage = "Sorry, I'm taking too long to respond. Please try asking again.";
        }
        
        if (selectedConversationId && !signal.aborted) {
            await addMessage({
                conversationId: selectedConversationId,
                text: fallbackMessage,
                sender: "ai",
            });
        }
        // No setIsAiResponding(false) here, finally block handles it
        return; // Important to return to allow finally to execute
      }


      if (!aiResponseData || !aiResponseData.responseText) {
        console.warn("[ChatView] Received empty or invalid AI response data:", aiResponseData);
        if (selectedConversationId && !signal.aborted) { 
          await addMessage({
            conversationId: selectedConversationId,
            text: "I seem to be having trouble formulating a response. Could you try again?",
            sender: "ai",
          });
        }
        // No setIsAiResponding(false) here, finally block handles it
        return;
      }
      
      if (selectedConversationId && !signal.aborted) { 
        await addMessage({
          conversationId: selectedConversationId,
          text: aiResponseData.responseText,
          sender: "ai",
        });

        // Background summarization
        const currentMessages = messages ?? []; 
        const aiMessageForSummary: MessageType = {
          id: Date.now().toString() + "_ai_summary_ref",
          text: aiResponseData.responseText,
          sender: "ai",
          timestamp: new Date(),
        };
        const updatedMessagesForSummary = [...currentMessages, userMessageForHistory, aiMessageForSummary];
        
        const fullHistoryForSummary = updatedMessagesForSummary
          .map(msg => `${msg.sender === "user" ? "User" : (msg.sender === "system" ? "System" : "AI")}: ${msg.text || ''}`)
          .join("\n");

        console.log('[ChatView] Triggering background summarization...');
        summarizeConversation({ conversationHistory: fullHistoryForSummary })
          .then(summaryData => {
            if (summaryData?.summary && selectedConversationId) { // Check selectedConversationId again
              console.log('[ChatView] Background summarization successful. Updating conversation summary.');
              updateConversation({ id: selectedConversationId, summary: summaryData.summary, lastMessageText: aiResponseData.responseText.substring(0,100) });
            } else {
              console.warn('[ChatView] Background summarization did not return a valid summary.');
            }
          })
          .catch(error => {
            console.error("[ChatView] Error summarizing conversation in background:", error);
          });
      }

    } catch (error) {
      console.error("[ChatView] Outer error in handleSendMessage:", error);
      if (selectedConversationId && !signal.aborted) { 
         await addMessage({
            conversationId: selectedConversationId,
            text: "Sorry, an unexpected error occurred. Please try again.",
            sender: "ai",
          });
      }
    } finally {
      console.log('[ChatView] handleSendMessage finally block. Aborted state:', signal.aborted);
      // Only reset loading if this was the active request that wasn't aborted.
      // If a new message was sent, a new controller is active, and this finally block
      // is for the older, aborted request.
      if (aiResponseAbortControllerRef.current === signal.source) { // Check if this is still the active controller
         setIsAiResponding(false);
         aiResponseAbortControllerRef.current = null;
         console.log('[ChatView] Reset isAiResponding to false and cleared abort controller.');
      } else {
         console.log('[ChatView] Not resetting isAiResponding; a newer request is active or this one was aborted.');
      }
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
