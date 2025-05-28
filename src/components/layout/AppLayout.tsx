
"use client";

import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatView } from "@/components/chat/ChatView";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react";

export function AppLayout() {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
        <ConversationList />
      </Sidebar>
      <SidebarInset className="flex flex-col h-screen overflow-hidden bg-background">
        <div className="p-2 md:hidden flex items-center justify-between border-b">
          <span className="font-semibold text-lg text-foreground">Shiro Speaks</span> {/* Changed LUMEN to Shiro Speaks */}
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft />
            </Button>
          </SidebarTrigger>
        </div>
         <div className="hidden md:flex items-center p-2 border-b min-h-[57px]">
           <SidebarTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft />
            </Button>
          </SidebarTrigger>
         </div>
        <ChatView />
      </SidebarInset>
    </SidebarProvider>
  );
}
