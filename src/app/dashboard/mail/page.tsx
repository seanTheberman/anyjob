"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Conversation {
  id: string;
  client_id: string;
  provider_id: string;
  bid_id?: string;
  is_active: boolean;
  client?: { id: string; first_name: string; last_name: string; profile_image_url?: string };
  provider?: { id: string; first_name: string; last_name: string; profile_image_url?: string };
  last_message?: { content: string; created_at: string; sender_id: string };
  unread_count?: number;
}

export default function MailPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  if (!currentUserId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 h-full overflow-hidden flex">
          {/* Conversation List */}
          <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedConversation ? "hidden md:flex" : ""}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                currentUserId={currentUserId}
                selectedId={selectedConversation?.id}
                onSelect={(conv) => setSelectedConversation(conv)}
              />
            </div>
          </div>

          {/* Chat Window */}
          <div className={`flex-1 ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
            <ChatWindow
              conversationId={selectedConversation?.id}
              currentUserId={currentUserId}
              onBack={() => setSelectedConversation(null)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
