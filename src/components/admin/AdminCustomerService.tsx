import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Toaster, toast } from 'sonner';
import { 
  MessageCircle, Send, RefreshCw, CheckCircle, User, 
  Clock, ChevronLeft, Search, Trash2
} from 'lucide-react';

interface Conversation {
  id: string;
  user_id: string;
  username: string;
  telegram_chat_id?: string;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_role: 'customer' | 'admin' | 'telegram_admin' | 'system';
  message: string;
  source: string;
  created_at: string;
  read_at?: string;
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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Fetch conversations on mount and subscribe to realtime
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
    
    // Subscribe to realtime updates
    subscriptionRef.current = supabase
      .channel('customer_messages_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customer_messages' },
        (payload) => {
          console.log('Realtime update:', payload);
          if (selectedConversation?.id) {
            fetchMessages(selectedConversation.id, true);
          }
          fetchConversations();
        }
      )
      .subscribe();
    
    // Poll for new conversations every 5 seconds as backup
    const interval = setInterval(() => {
      if (isMounted) {
        fetchConversations();
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) return;

    let isMounted = true;
    
    const loadMessages = async () => {
      if (!isMounted) return;
      await fetchMessages(selectedConversation.id);
    };
    
    loadMessages();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      if (isMounted) {
        fetchMessages(selectedConversation.id, true);
      }
    }, 3000);

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
      console.log('📨 ADMIN: Fetching conversations');
      const { data, error } = await supabase
        .from('customer_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      const conversationsData = data || [];
      
      // Process conversations with metadata
      const processedConversations = await Promise.all(
        conversationsData.map(async (conv) => {
          try {
            // Get unread count
            const { count } = await supabase
              .from('customer_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('sender_role', 'customer')
              .is('read_at', null);

            // Get last message
            const { data: lastMsg } = await supabase
              .from('customer_messages')
              .select('message, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...conv,
              unread_count: count || 0,
              last_message: lastMsg?.message || ''
            };
          } catch (err) {
            console.error('Error processing conversation:', conv.id, err);
            return {
              ...conv,
              unread_count: 0,
              last_message: ''
            };
          }
        })
      );

      console.log('📨 ADMIN: Loaded', processedConversations.length, 'conversations');
      setConversations(processedConversations);
      setError(null);
    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setError('Failed to fetch conversations');
    }
  };

  const fetchMessages = async (conversationId: string, isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      
      console.log('📨 ADMIN: Fetching messages for conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('customer_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('📨 ADMIN: Loaded', data?.length || 0, 'messages');
      setMessages(data || []);

      // Mark customer messages as read
      if (!isPolling) {
        await supabase
          .from('customer_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('sender_role', 'customer')
          .is('read_at', null);
        
        // Refresh conversations to update unread counts
        fetchConversations();
      }
    } catch (err) {
      console.error('Error in fetchMessages:', err);
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    
    try {
      console.log('📤 ADMIN: Sending reply:', messageText);
      
      // Save to database
      const { error } = await supabase
        .from('customer_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_role: 'admin',
          message: messageText,
          source: 'dashboard',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving admin reply:', error);
        toast.error('Failed to send message');
        return;
      }

      console.log('💾 ADMIN: Reply saved to database');

      // Also send to Telegram if conversation has Telegram chat
      if (selectedConversation.telegram_chat_id) {
        await sendTelegramReply(
          selectedConversation.telegram_chat_id, 
          messageText
        );
      }

      setNewMessage('');
      await fetchMessages(selectedConversation.id);
      toast.success('Message sent');
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const sendTelegramReply = async (chatId: string, message: string) => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '8513756424:AAGvKY6eJK8ANfqC2S-5z0LlXM-YDRGbmaA';
      
      console.log('📤 ADMIN: Sending Telegram reply to chat:', chatId);
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `📨 SUPPORT REPLY:\n\n${message}`,
          parse_mode: 'HTML'
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ ADMIN: Telegram reply sent successfully');
      } else {
        console.error('❌ ADMIN: Telegram API error:', result);
      }
    } catch (err) {
      console.error('Error sending Telegram reply:', err);
    }
  };

  const closeConversation = async (convId: string) => {
    try {
      const { error } = await supabase
        .from('customer_conversations')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', convId);

      if (error) {
        console.error('Error closing conversation:', error);
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
      // First delete all messages in the conversation
      const { error: msgError } = await supabase
        .from('customer_messages')
        .delete()
        .eq('conversation_id', convId);

      if (msgError) {
        console.error('Error deleting messages:', msgError);
        toast.error('Failed to delete conversation messages');
        return;
      }

      // Then delete the conversation
      const { error } = await supabase
        .from('customer_conversations')
        .delete()
        .eq('id', convId);

      if (error) {
        console.error('Error deleting conversation:', error);
        toast.error('Failed to delete conversation');
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
      const username = conv.username || '';
      const id = conv.id || '';
      const search = searchTerm || '';
      const matchesSearch = username.toLowerCase().includes(search.toLowerCase()) ||
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
                      <p className="text-white font-medium text-sm">{conv.username || 'Unknown'}</p>
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
                    <h3 className="text-white font-semibold text-sm md:text-base truncate">{selectedConversation.username || 'Unknown User'}</h3>
                    <p className="text-slate-400 text-xs md:text-sm hidden sm:block">
                      {selectedConversation.telegram_chat_id ? 'Telegram connected' : 'Website only'}
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
              <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`flex ${
                        msg.sender_role === 'customer' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                        msg.sender_role === 'customer'
                          ? 'bg-white/10 text-white rounded-tl-none'
                          : msg.sender_role === 'telegram_admin'
                          ? 'bg-purple-500/30 text-white rounded-tr-none border border-purple-400/30'
                          : 'bg-pink-500/30 text-white rounded-tr-none border border-pink-400/30'
                      }`}>
                        <p className="text-sm">{msg.message || 'No content'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/60">
                            {msg.created_at ? formatTime(msg.created_at) : 'Unknown time'}
                          </span>
                          {msg.source === 'telegram' && (
                            <span className="text-xs text-purple-400">via Telegram</span>
                          )}
                          {msg.source === 'dashboard' && (
                            <span className="text-xs text-pink-400">via Dashboard</span>
                          )}
                        </div>
                      </div>
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
                    onKeyPress={(e) => e.key === 'Enter' && !isSending && sendReply()}
                    placeholder="Type your reply..."
                    disabled={isSending}
                    className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 disabled:opacity-50 text-sm md:text-base"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">Select a conversation to view messages</p>
              <p className="text-sm mt-2">
                {Array.isArray(conversations) ? conversations.length : 0} total {Array.isArray(conversations) && conversations.length === 1 ? 'conversation' : 'conversations'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerService;
