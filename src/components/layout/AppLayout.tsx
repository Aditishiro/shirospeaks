
"use client";

import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatView } from "@/components/chat/ChatView";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react"; // Ensure React is imported for JSX if not already

export function AppLayout() {
  const isMobile = useIsMobile();

  // If isMobile is undefined, it means the hook hasn't determined the screen size yet.
  // Return a loading state to prevent hydration mismatch until client-side determination.
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
        {/* Ensure ConversationList is rendered. If it causes issues, it might need its own loading state or check. */}
        <ConversationList />
      </Sidebar>
      <SidebarInset className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Mobile header: only shown if isMobile is true, or for triggering sidebar on small screens */}
        <div className="p-2 md:hidden flex items-center justify-between border-b">
          {/* You can add a logo or title here if needed for mobile */}
          <span className="font-semibold text-lg text-foreground">LUMEN</span>
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft />
            </Button>
          </SidebarTrigger>
        </div>
         {/* Desktop: Optional fixed space for a trigger if sidebar is collapsible, or header content */}
         {/* This div is hidden on mobile (md:flex) */}
         <div className="hidden md:flex items-center p-2 border-b min-h-[57px]">
           <SidebarTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft />
            </Button>
          </SidebarTrigger>
           {/* You can add a title or other controls here for the desktop header area */}
         </div>
        <ChatView />
      </SidebarInset>
    </SidebarProvider>
  );
}
