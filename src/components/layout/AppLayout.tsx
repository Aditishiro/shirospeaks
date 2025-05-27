"use client";

import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatView } from "@/components/chat/ChatView";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"; // Assuming you have this hook

export function AppLayout() {
  const isMobile = useIsMobile();

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
