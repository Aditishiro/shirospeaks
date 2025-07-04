
"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useMessages } from "@/hooks/useMessages";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Cat } from "lucide-react";
import { generateAiResponse, type GenerateAiResponseOutput } from "@/ai/flows/generate-ai-response";
import { summarizeConversation } from "@/ai/flows/summarize-conversation";
import { useConversations } from "@/hooks/useConversations";
import type { Message as MessageType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PixelCatAnimationPlaceholder } from "@/components/decorations/PixelCatAnimationPlaceholder";

const AI_RESPONSE_TIMEOUT_MS = 30000;

export function ChatView() {
  const {
    selectedConversationId,
    isAiResponding,
    setIsAiResponding,
  } = useAppContext();
  const { messages, isLoadingMessages, addMessage } = useMessages(selectedConversationId);
  const { updateConversation } = useConversations();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const aiResponseAbortControllerRef = useRef<AbortController | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

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

    console.log("[ChatView] handleSendMessage called with:", messageText);
    setIsAiResponding(true);
    setClientError(null);

    if (aiResponseAbortControllerRef.current) {
      console.log("[ChatView] Aborting previous AI response request.");
      aiResponseAbortControllerRef.current.abort();
    }
    aiResponseAbortControllerRef.current = new AbortController();
    const signal = aiResponseAbortControllerRef.current.signal;

    const userMessageForHistory: MessageType = {
      id: Date.now().toString() + "_user_temp",
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    try {
      console.log("[ChatView] Attempting to add user message to Firestore:", messageText);
      await addMessage({
        conversationId: selectedConversationId,
        text: messageText,
        sender: "user",
      });
      console.log("[ChatView] User message added via addMessage call.");
    } catch (error: any) {
      console.error("[ChatView] Error adding user message to Firestore:", error.name, error.message, error.stack);
      setClientError(`Failed to send your message. Database error: ${error.message}. Please try again.`);
      // Even if adding message fails, we might still want to try getting an AI response
      // or we might decide to stop here. For now, let's proceed to AI.
    }

    try {
      console.log("[ChatView] Calling generateAiResponse Server Action for:", messageText);
      const aiResponsePromise = generateAiResponse({
        currentMessage: messageText
      });

      const timeoutPromise = new Promise<GenerateAiResponseOutput>((_, reject) =>
        setTimeout(() => {
          console.warn('[ChatView] Client-side AI response timeout triggered.');
          reject(new Error('AI_RESPONSE_CLIENT_TIMEOUT'));
        }, AI_RESPONSE_TIMEOUT_MS)
      );

      let aiResponseData: GenerateAiResponseOutput | undefined;
      try {
        console.log('[ChatView] Waiting for AI response or client timeout...');
        aiResponseData = await Promise.race([aiResponsePromise, timeoutPromise]);

        if (signal.aborted) {
          console.log("[ChatView] AI response aborted by new message send or component unmount. Discarding result.");
          return;
        }
        console.log('[ChatView] AI Response SUCCESS:', JSON.stringify(aiResponseData, null, 2));

      } catch (raceError: any) {
        console.error("[ChatView] AI Response ERROR in Promise.race (AI flow call or client timeout):", raceError.name, raceError.message, raceError.stack);
        if (signal.aborted) {
          console.log("[ChatView] Error occurred for an aborted request. Ignoring.");
          return;
        }

        let errorMessage = "Sorry, I encountered an error processing your request. Please try again.";
        if (raceError.message === 'AI_RESPONSE_CLIENT_TIMEOUT') {
          errorMessage = "Sorry, Shiro is taking too long to respond. Please try asking again.";
        } else if (raceError.message) {
          errorMessage = `AI Error: ${raceError.message}`;
        }
        setClientError(errorMessage);
        // Add the error message as an AI message to the chat
        if (selectedConversationId) {
            await addMessage({
                conversationId: selectedConversationId,
                text: errorMessage,
                sender: "ai", // Or "system" if preferred for errors
            });
        }
        return;
      }

      if (!aiResponseData || typeof aiResponseData.responseText !== 'string') {
        console.warn("[ChatView] Received invalid or empty AI response data:", aiResponseData);
        const invalidResponseMessage = "Shiro seems to be having trouble formulating a response. Could you try again?";
        setClientError(invalidResponseMessage);
        if (selectedConversationId && !signal.aborted) {
          await addMessage({
            conversationId: selectedConversationId,
            text: invalidResponseMessage,
            sender: "ai",
          });
        }
        return;
      }

      console.log("[ChatView] AI response successful. Text:", aiResponseData.responseText);
      if (selectedConversationId && !signal.aborted) {
        await addMessage({
          conversationId: selectedConversationId,
          text: aiResponseData.responseText,
          sender: "ai",
        });

        const currentMessages = messages ?? [];
        const aiMessageForSummary: MessageType = {
          id: Date.now().toString() + "_ai_summary_ref",
          text: aiResponseData.responseText,
          sender: "ai",
          timestamp: new Date(),
        };
        const updatedMessagesForSummary = [...currentMessages, userMessageForHistory, aiMessageForSummary];

        const fullHistoryForSummary = updatedMessagesForSummary
          .map(msg => `${msg.sender === "user" ? "User" : (msg.sender === "system" ? "System" : "Shiro")}: ${msg.text || ''}`)
          .join("\n").substring(0, 15000);

        console.log('[ChatView] Triggering background summarization...');
        summarizeConversation({ conversationHistory: fullHistoryForSummary })
          .then(summaryData => {
            if (summaryData?.summary && selectedConversationId) {
              console.log('[ChatView] Background summarization successful. Updating conversation summary.');
              updateConversation({ id: selectedConversationId, summary: summaryData.summary, lastMessageText: aiResponseData.responseText.substring(0,100) });
            } else {
              console.warn('[ChatView] Background summarization did not return a valid summary or conversation ID changed.');
            }
          })
          .catch(error => {
            console.error("[ChatView] Error summarizing conversation in background:", error);
          });
      }

    } catch (error: any) {
      console.error("[ChatView] Outer error in handleSendMessage (likely after AI response was received):", error.name, error.message, error.stack);
      const outerErrorMessage = "Sorry, an unexpected error occurred after getting Shiro's response. Please try again.";
      setClientError(outerErrorMessage);
      if (selectedConversationId && !signal.aborted) {
         await addMessage({
            conversationId: selectedConversationId,
            text: outerErrorMessage,
            sender: "ai",
          });
      }
    } finally {
      console.log('[ChatView] handleSendMessage finally block. Aborted state:', signal.aborted);
      if (aiResponseAbortControllerRef.current && aiResponseAbortControllerRef.current.signal === signal && !signal.aborted) {
         setIsAiResponding(false);
         aiResponseAbortControllerRef.current = null;
         console.log('[ChatView] Reset isAiResponding to false and cleared current abort controller.');
      } else {
         console.log('[ChatView] Not resetting isAiResponding; a newer request is active or this one was aborted/completed by another path, or already reset.');
         if (aiResponseAbortControllerRef.current && aiResponseAbortControllerRef.current.signal === signal) {
            setIsAiResponding(false);
         }
      }
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  if (!selectedConversationId && !isLoadingMessages) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <PixelCatAnimationPlaceholder />
        <h2 className="text-2xl font-semibold mb-2 mt-4">Welcome to Shiro Speaks</h2>
        <p className="text-muted-foreground">
          Select a conversation or start a new one to begin.
          <br />
          Fun fact - Shiro loves cats!
        </p>
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
      <div className="flex flex-col h-full">
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <PixelCatAnimationPlaceholder />
          <h2 className="text-xl font-semibold mb-2 mt-4">Chat is Empty</h2>
          <p className="text-muted-foreground">
            Type your message below to start the conversation.
            <br />
            Fun fact - Shiro loves cats!
          </p>
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {messages && messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onSuggestionClick={handleSuggestionClick} />
        ))}
        {isAiResponding &&
         (messages && messages.length > 0 && messages[messages.length -1]?.sender === 'user') && (
           <div className="flex items-start space-x-3 py-3 justify-start">
             <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    <Cat className="h-5 w-5 animate-spin" />
                </AvatarFallback>
             </Avatar>
             <div className="bg-card/60 dark:bg-zinc-800/60 backdrop-blur-md border border-border/30 dark:border-zinc-700/50 p-3 rounded-xl shadow-md max-w-[70%]">
                <p className="text-sm text-muted-foreground">Shiro is thinking...</p>
             </div>
           </div>
        )}
        {clientError && (
            <div className="p-4 my-2 text-sm text-destructive-foreground bg-destructive/80 rounded-md shadow-md">
                Client-side error: {clientError}
            </div>
        )}
      </ScrollArea>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
    </div>
  );
}
