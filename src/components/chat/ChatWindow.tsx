"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import { Send, ArrowLeft, Loader2, User, Paperclip, Share2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments?: unknown[];
  is_read: boolean;
  created_at: string;
}

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

interface ChatWindowProps {
  conversationId?: string;
  currentUserId: string;
  onBack?: () => void;
}

export function ChatWindow({ conversationId, currentUserId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showReferral, setShowReferral] = useState(false);
  const [referralEmail, setReferralEmail] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messagesScrollRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat?action=messages&conversation_id=${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setConversation(data.conversation);
          requestAnimationFrame(() => scrollToBottom("auto"));
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, scrollToBottom]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eloo_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Scroll to bottom on new messages
  useLayoutEffect(() => {
    if (loading) return;
    requestAnimationFrame(() => scrollToBottom("auto"));
  }, [conversationId, loading, messages.length, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, content }),
      });

      if (!res.ok) {
        setNewMessage(content);
      } else {
        const data = await res.json().catch(() => null);
        if (data?.message) {
          setMessages((prev) => (prev.some((msg) => msg.id === data.message.id) ? prev : [...prev, data.message]));
        }
        requestAnimationFrame(() => scrollToBottom("auto"));
      }
    } catch {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const otherUser = conversation
    ? conversation.client_id === currentUserId
      ? conversation.provider
      : conversation.client
    : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSendAttachment = async () => {
    if (!selectedFile || !conversationId || sending) return;
    setSelectedFile(null);
    // TODO: upload file and send attachment
  };

  if (!conversationId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white text-gray-500 dark:bg-gray-900">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <a
          href={otherUser ? `/profile/${otherUser.id}` : undefined}
          className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {otherUser?.profile_image_url ? (
            <img src={otherUser.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {[otherUser?.first_name, otherUser?.last_name].filter(Boolean).join(" ") || "Conversation"}
            </h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </a>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {loading ? (
          <div className="flex h-full items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[min(72%,44rem)] break-words rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine
                        ? "rounded-br-md bg-red-600 text-white"
                        : "rounded-bl-md bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${isMine ? "text-red-100" : "text-gray-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 space-y-3 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            title="Send"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
          <label className="flex items-center gap-1 cursor-pointer hover:text-gray-800 dark:hover:text-white">
            <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
            <Paperclip className="w-5 h-5" />
            <span className="text-sm">Attach</span>
          </label>

          {selectedFile && (
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-800 dark:text-gray-100 truncate max-w-[140px]">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSendAttachment}
                className="text-red-600 hover:text-red-700 text-sm"
                title="Send attachment"
              >
                Send
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowReferral(true)}
            className="flex items-center gap-1 text-sm hover:text-gray-800 dark:hover:text-white"
            title="Refer"
          >
            <Share2 className="w-5 h-5" />
            <span>Refer</span>
          </button>
        </div>
      </form>

      {showReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Refer to another freelancer</h3>
              <button onClick={() => setShowReferral(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Freelancer Email</label>
                <input
                  type="email"
                  value={referralEmail}
                  onChange={(e) => setReferralEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="freelancer@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Message (optional)</label>
                <textarea
                  value={referralMessage}
                  onChange={(e) => setReferralMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="I think you'd be perfect for this job..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReferral(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowReferral(false)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Send Referral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
