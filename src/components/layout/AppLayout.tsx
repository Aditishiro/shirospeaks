
"use client";

import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatView } from "@/components/chat/ChatView";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"; 

export function AppLayout() {
  const isMobile = useIsMobile();

  // Wait until isMobile has been determined on the client
  if (isMobile === undefined) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ); // Or a more sophisticated layout skeleton
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar collapsible="icon" className="border-r">
        <ConversationList />
      </Sidebar>
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
         {!isMobile && ( /* Desktop trigger is inside sidebar */
            <div className="p-2 md:hidden"> {/* Mobile trigger */}
              <SidebarTrigger asChild>
                <Button variant="ghost" size="icon"><PanelLeft /></Button>
              </SidebarTrigger>
            </div>
          )}
        <ChatView />
      </SidebarInset>
    </SidebarProvider>
  );
}
