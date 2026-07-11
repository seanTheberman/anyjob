"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { MessageSquare, Loader2, User } from "lucide-react";
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

interface ConversationListProps {
  currentUserId: string;
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  autoSelectFirst?: boolean;
}

export function ConversationList({ currentUserId, selectedId, onSelect, autoSelectFirst = false }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    onSelectRef.current = onSelect;
  }, [onSelect, selectedId]);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat?action=conversations");
        if (res.ok) {
          const data = await res.json();
          const nextConversations = data.conversations || [];
          setConversations(nextConversations);
          const shouldAutoSelect = autoSelectFirst && !selectedIdRef.current && typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
          if (shouldAutoSelect && nextConversations.length > 0) {
            onSelectRef.current(nextConversations[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to new messages for unread count updates
    const channel = supabase
      .channel("conversation-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eloo_messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoSelectFirst, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No conversations yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Conversations will appear here when a bid is accepted
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {conversations.map((conv) => {
        const otherUser =
          conv.client_id === currentUserId ? conv.provider : conv.client;
        const isSelected = selectedId === conv.id;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
              isSelected ? "bg-red-50 dark:bg-red-950/20" : ""
            }`}
          >
            {otherUser?.profile_image_url ? (
              <img
                src={otherUser.profile_image_url}
                alt=""
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {otherUser?.first_name} {otherUser?.last_name}
                </h4>
                {conv.last_message && (
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {new Date(conv.last_message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-gray-500 truncate">
                  {conv.last_message
                    ? conv.last_message.sender_id === currentUserId
                      ? `You: ${conv.last_message.content}`
                      : conv.last_message.content
                    : "No messages yet"}
                </p>
                {(conv.unread_count ?? 0) > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
