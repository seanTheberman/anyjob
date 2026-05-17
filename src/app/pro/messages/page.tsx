"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { MessageCircle, Search, Send, Paperclip, User, Share2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Conversation {
  id: string;
  client_id: string;
  provider_id: string;
  bid_id?: string;
  is_active: boolean;
  created_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  provider?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralEmail, setReferralEmail] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat?action=conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat?action=messages&conversation_id=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendAttachment = async () => {
    if (!selectedFile || !selectedConversation) return;

    // TODO: Upload file to storage and send as attachment
    console.log("Uploading file:", selectedFile.name);
    setSelectedFile(null);
  };

  const handleReferral = async () => {
    if (!referralEmail.trim() || !selectedConversation) return;

    try {
      // TODO: Send referral email
      console.log("Referring to:", referralEmail, "Message:", referralMessage);
      setShowReferralModal(false);
      setReferralEmail("");
      setReferralMessage("");
    } catch (error) {
      console.error("Error sending referral:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages(selectedConversation.id);
        fetchConversations(); // Refresh conversations to update last message
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getClientName = (conversation: Conversation) => {
    // For provider view, show client name
    if (conversation.client?.first_name) {
      return `${conversation.client.first_name} ${conversation.client.last_name || ""}`.trim();
    }
    
    // Fallback: try to get from the first message (client's message)
    const clientMessage = messages.find(m => m.sender_id !== currentUserId);
    if (clientMessage && clientMessage.sender_id === conversation.client_id) {
      // If we have the client ID, we can use a default name
      return "Client";
    }
    
    return "Client";
  };

  const getOtherUserName = (conversation: Conversation) => {
    // For provider view, get client name
    return getClientName(conversation);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (loading || !currentUserId) {
    return (
      <ProviderLayout>
        <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
          <div className="text-center py-12">
            <p>Loading messages...</p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Communicate with your clients</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversation List */}
            <div className="border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Conversations will appear when a bid is accepted</p>
                  </div>
                ) : (
                  conversations
                    .filter((conv) =>
                      getClientName(conv).toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">{getClientName(conversation)}</h3>
                            <span className="text-xs text-gray-500">
                              {formatDate(conversation.last_message?.created_at || conversation.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.last_message?.content || "No messages yet"}
                          </p>
                        </div>
                        {(conversation.unread_count || 0) > 0 && (
                          <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                            {conversation.unread_count!}
                          </div>
                        )}
                      </button>
                    ))
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <a
                      href={`/profile/${selectedConversation.client_id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{getClientName(selectedConversation)}</h3>
                        <p className="text-sm text-green-600">Online</p>
                      </div>
                    </a>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = message.sender_id === currentUserId;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                isMine
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isMine
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 space-y-3">
                    {/* Message Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <button
                        onClick={selectedFile ? handleSendAttachment : sendMessage}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action bar beneath input */}
                    <div className="flex items-center gap-3 text-gray-600">
                      <label className="flex items-center gap-1 cursor-pointer hover:text-gray-800">
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <Paperclip className="w-5 h-5" />
                        <span className="text-sm">Attach</span>
                      </label>

                      {selectedFile && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
                          <span className="text-sm text-gray-700 truncate max-w-[160px]">{selectedFile.name}</span>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setShowReferralModal(true)}
                        className="flex items-center gap-1 text-sm hover:text-gray-800"
                        title="Refer to another freelancer"
                      >
                        <Share2 className="w-5 h-5" />
                        <span>Refer</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Refer to Another Freelancer</h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freelancer Email
                </label>
                <input
                  type="email"
                  value={referralEmail}
                  onChange={(e) => setReferralEmail(e.target.value)}
                  placeholder="freelancer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={referralMessage}
                  onChange={(e) => setReferralMessage(e.target.value)}
                  placeholder="I think you'd be perfect for this job..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReferral}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Send Referral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}
