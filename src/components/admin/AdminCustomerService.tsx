import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import {
  MessageCircle, Send, RefreshCw, CheckCircle, User,
  Clock, ChevronLeft, Search, Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
interface Conversation {
  id: string;
  user_id: string;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

const AdminCustomerService: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'pending'>('all');
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const pollIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
  // Fetch conversations on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadConversations = async () => {
      if (!isMounted) return;
      try {
        await fetchConversations();
      } catch (err) {
        console.error('Failed to load conversations:', err);
        if (isMounted) setError('Failed to load conversations');
      }
    };
    
    loadConversations();

    // Poll for new conversations every 15 seconds (reduced from 5s to avoid excessive polling)
    const interval = setInterval(() => {
      if (isMounted) {
        fetchConversations();
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) return;

    let isMounted = true;

    const loadAdminMessages = async () => {
      if (!isMounted) return;
      await fetchMessages(selectedConversation.id);
    };

    loadAdminMessages();

    // Poll for new messages every 30 seconds (reduced from 10s to avoid aggressive polling)
    pollIntervalRef.current = setInterval(() => {
      if (isMounted && selectedConversation?.id) {
  fetchMessages(selectedConversation.id, true);
}
  }, 5000);  

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedConversation?.id]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin-customer-service');

      if (!response.ok) {
        console.error('Error fetching conversations:', response.statusText);
        return;
      }

      const data = await response.json();
      const processedConversations = data.conversations || [];

      setConversations(processedConversations);
      setError(null);
    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setError('Failed to fetch conversations');
    }
  };

 const fetchMessages = async (conversationId: string, isPolling = false) => {
  if (!conversationId) return;

  if (isPolling && isFetchingRef.current) {
  console.log("⏳ Skipping polling: already fetching");
  return;
}

  isFetchingRef.current = true;

  if (!isPolling) {
    setIsLoading(true);
  }

  try {
    const { data, error } = await supabase
      .from('customer_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    console.log("✅ Messages fetched:", data);

    if (error) {
      console.error('Supabase error:', error);
      setError('Failed to load messages');
      setMessages([]);
      return;
    }

    setMessages(data || []);

    if (!isPolling) {
      fetchConversations();
    }

  } catch (err) {
    console.error('Error in fetchMessages:', err);
  } finally {
  isFetchingRef.current = false;
  setIsLoading(false); // ALWAYS stop loading
}
};
 const sendReply = async () => {
  if (!newMessage.trim() || !selectedConversation || isSending) return;

  setIsSending(true);

  try {
    const response = await fetch('/api/admin-customer-service-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedConversation.id,
        userId: selectedConversation.user_id,
        content: newMessage.trim(),
      }),
    });

    if (!response.ok) {
      console.error('Error sending reply:', response.statusText);
      return;
    }

    setNewMessage('');
    fetchMessages(selectedConversation.id);
  } catch (err) {
    console.error('Error sending reply:', err);

  } finally {
    // ✅ ONLY ONE PLACE FOR THIS
    setIsSending(false);
  }
};

  const closeConversation = async (convId: string) => {
    try {
      const response = await fetch('/api/admin-customer-service-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId })
      });

      if (!response.ok) {
        console.error('Error closing conversation:', response.statusText);
        toast.error('Failed to close conversation');
        return;
      }

      toast.success('Conversation closed');
      fetchConversations();
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error closing conversation:', err);
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      const response = await fetch('/api/admin-customer-service-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId })
      });

      if (!response.ok) {
  console.error('Error deleting conversation:', response.statusText);
  return;
}

      toast.success('Conversation deleted');
      fetchConversations();
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Safely filter conversations
  const filteredConversations = React.useMemo(() => {
    if (!Array.isArray(conversations)) return [];

    return conversations.filter(conv => {
      if (!conv || typeof conv !== 'object') return false;
      const userId = conv.user_id || '';
      const id = conv.id || '';
      const search = searchTerm || '';
      const matchesSearch = userId.toLowerCase().includes(search.toLowerCase()) ||
                           id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [conversations, searchTerm, statusFilter]);

  // Count open conversations safely
  const openConversationsCount = React.useMemo(() => {
    if (!Array.isArray(conversations)) return 0;
    return conversations.filter(c => c && c.status === 'open').length;
  }, [conversations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-right" />
      
      <div className="flex h-screen flex-col md:flex-row">
        {/* Sidebar - Conversation List */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-slate-900/50 border-r border-white/10 flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-pink-500" />
              Customer Service
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {openConversationsCount} open {openConversationsCount === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'open', 'pending', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left border-b border-white/5 transition-colors ${
                  selectedConversation?.id === conv.id
                    ? 'bg-pink-500/20 border-l-4 border-l-pink-500'
                    : 'hover:bg-white/5 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{conv.user_id?.slice(0, 8) || 'Unknown'}</p>
                      <p className="text-slate-400 text-xs">{conv.id?.slice(0, 8) || 'N/A'}</p>
                    </div>
                  </div>
                  {conv.unread_count ? (
                    <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded-full font-bold">
                      {conv.unread_count}
                    </span>
                  ) : null}
                </div>
                <p className="text-slate-400 text-sm mt-2 truncate">
                  {conv.last_message || 'No messages yet'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    conv.status === 'open' ? 'bg-green-500/20 text-green-400' :
                    conv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {conv.status || 'unknown'}
                  </span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {conv.updated_at ? formatTime(conv.updated_at) : 'N/A'}
                  </span>
                </div>
              </button>
            )))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-900/30`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-2 md:p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm md:text-base truncate">{selectedConversation.user_id?.slice(0, 8) || 'Unknown User'}</h3>
                    <p className="text-slate-400 text-xs md:text-sm hidden sm:block">
                      Customer Service
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => fetchMessages(selectedConversation.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => deleteConversation(selectedConversation.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex-shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-medium hidden lg:inline">Delete</span>
                  </button>
                  <button
                    onClick={() => closeConversation(selectedConversation.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex-shrink-0"
                    title="Resolve conversation"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium hidden lg:inline">Resolve</span>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 bg-slate-800/50">
                {isLoading ? (
                  <div className="text-slate-400">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="text-slate-400">No messages yet</div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="p-3 rounded bg-slate-700/80 border border-slate-600">
                      <p className="text-white">{msg.content || "No content"}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-2 md:p-4 border-t border-white/10">
                <div className="flex gap-2 md:gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !isSending && sendReply()
                    }
                    placeholder="Type your reply..."
                    disabled={isSending}
                    className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-white/5 border rounded"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 md:px-6 md:py-3 bg-blue-500 text-white rounded"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white rounded-full animate-spin" />
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerService;
