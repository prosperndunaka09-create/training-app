import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import {
  MessageCircle, Send, RefreshCw, CheckCircle, User,
  Clock, ChevronLeft, Search, Trash2, Unlock, Lock,
  AlertCircle, CheckCheck, X, Paperclip, FileText, Image as ImageIcon
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
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
}

const AdminCustomerService: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'pending'>('all');
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const subscriptionsRef = useRef<any[]>([]);
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  // Attachment states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload JPG, PNG, WEBP, or PDF files only.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Maximum file size is 10MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAttachment = async (file: File): Promise<{url: string, type: string, name: string, size: number} | null> => {
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `admin/${timestamp}-${randomString}-${sanitizedName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[AdminCustomerService] Upload error:', uploadError);
        toast.error('Upload failed: ' + uploadError.message);
        return null;
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        type: file.type,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('[AdminCustomerService] Upload exception:', error);
      toast.error('Failed to upload attachment. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const sendReply = async () => {
    const messageText = newMessage.trim();
    
    // Allow sending if there's text OR an attachment
    if ((!messageText && !selectedFile) || !selectedConversation || isSending || isUploading) return;

    console.log('[AdminCustomerService] Sending reply to conversation:', selectedConversation.id);
    setIsSending(true);

    let attachmentData: {url: string, type: string, name: string, size: number} | null = null;
    
    // Upload attachment if present
    if (selectedFile) {
      attachmentData = await uploadAttachment(selectedFile);
      if (!attachmentData) {
        setIsSending(false);
        return;
      }
    }

    try {
      // Build message insert data
      const messageData: any = {
        conversation_id: selectedConversation.id,
        sender: 'admin',
        message: messageText || null
      };
      
      // Add attachment data if present
      if (attachmentData) {
        messageData.attachment_url = attachmentData.url;
        messageData.attachment_type = attachmentData.type;
        messageData.attachment_name = attachmentData.name;
        messageData.attachment_size = attachmentData.size;
      }

      // Insert admin message into Supabase
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('[AdminCustomerService] Error sending reply:', error);
        toast.error('Failed to send reply');
        return;
      }

      console.log('[AdminCustomerService] Reply saved:', savedMessage?.id);

      // Clear attachment after successful send
      if (attachmentData) {
        clearAttachment();
      }

      // Track message ID
      if (savedMessage?.id) {
        processedMessageIds.current.add(savedMessage.id);
      }

      // Optimistically add to UI
      const newMsg: Message = {
        id: savedMessage?.id || crypto.randomUUID(),
        conversation_id: selectedConversation.id,
        user_id: 'admin',
        content: messageText,
        created_at: savedMessage?.created_at || new Date().toISOString(),
        attachment_url: savedMessage?.attachment_url,
        attachment_type: savedMessage?.attachment_type,
        attachment_name: savedMessage?.attachment_name,
        attachment_size: savedMessage?.attachment_size
      };
      setMessages(prev => [...prev, newMsg]);

      // Update conversation updated_at and ensure status is open
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          status: selectedConversation.status === 'closed' ? 'open' : selectedConversation.status
        })
        .eq('id', selectedConversation.id);

      // Update conversation in state
      setSelectedConversation(prev => prev ? {
        ...prev,
        updated_at: new Date().toISOString(),
        status: prev.status === 'closed' ? 'open' : prev.status
      } : null);

      setNewMessage('');
      toast.success(attachmentData ? 'Reply with attachment sent successfully' : 'Reply sent successfully');
    } catch (err) {
      console.error('[AdminCustomerService] Error in sendReply:', err);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

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

    // Poll for new messages every 10 seconds (minimum to avoid aggressive polling)
    pollIntervalRef.current = setInterval(() => {
      if (isMounted && selectedConversation?.id) {
        fetchMessages(selectedConversation.id, true);
      }
    }, 10000);  

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedConversation?.id]);

  // Real-time subscription for new messages and conversation updates
  useEffect(() => {
    if (!selectedConversation?.id) return;

    console.log('[AdminCustomerService] Setting up realtime for conversation:', selectedConversation.id);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`admin-messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          console.log('[AdminCustomerService] Realtime message received:', payload);
          const newMessage = payload.new as any;
          
          // Prevent duplicates
          if (processedMessageIds.current.has(newMessage.id)) {
            console.log('[AdminCustomerService] Duplicate message ignored:', newMessage.id);
            return;
          }
          processedMessageIds.current.add(newMessage.id);
          
          const transformedMsg = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            user_id: newMessage.sender === 'user' ? 'user' : 'admin',
            content: newMessage.message,
            created_at: newMessage.created_at,
            attachment_url: newMessage.attachment_url,
            attachment_type: newMessage.attachment_type,
            attachment_name: newMessage.attachment_name,
            attachment_size: newMessage.attachment_size,
          };
          
          setMessages((prev) => {
            const exists = prev.some(m => m.id === transformedMsg.id);
            if (exists) return prev;
            return [...prev, transformedMsg];
          });
          
          // Show notification for user messages
          if (newMessage.sender === 'user') {
            toast.info('New message from customer');
            fetchConversations();
          }
        }
      )
      .subscribe((status) => {
        console.log('[AdminCustomerService] Messages subscription status:', status);
      });

    // Subscribe to conversation status changes
    const conversationChannel = supabase
      .channel(`admin-conversation-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          console.log('[AdminCustomerService] Conversation status update:', payload);
          const updated = payload.new as any;
          
          setSelectedConversation(prev => prev ? { 
            ...prev, 
            status: updated.status,
            updated_at: updated.updated_at 
          } : null);
          
          fetchConversations();
        }
      )
      .subscribe((status) => {
        console.log('[AdminCustomerService] Conversation subscription status:', status);
      });

    subscriptionsRef.current = [messagesChannel, conversationChannel];

    return () => {
      console.log('[AdminCustomerService] Removing realtime subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationChannel);
      subscriptionsRef.current = [];
    };
  }, [selectedConversation?.id]);

  // Real-time subscription for ALL new messages (to update conversation list)
  useEffect(() => {
    const messagesChannel = supabase
      .channel('admin-all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🔥 New message received (all):', payload);
          // Refresh conversations to show updated last message
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  // Real-time subscription for new conversations
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('admin-conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('🔥 New conversation received:', payload);
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  const fetchConversations = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('[AdminCustomerService] Skipping fetch - already in progress');
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    console.log('[AdminCustomerService] Fetching conversations...');
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[AdminCustomerService] Error fetching conversations:', error);
        setError('Failed to fetch conversations: ' + error.message);
        setConversations([]);
        return;
      }

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('message, created_at, sender')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (msgError) {
            console.error('[AdminCustomerService] Error fetching last message:', msgError);
          }
          
          return {
            ...conv,
            last_message: messages?.[0]?.message || '',
            unread_count: 0
          };
        })
      );

      console.log('[AdminCustomerService] Fetched', conversationsWithLastMessage.length, 'conversations');
      setConversations(conversationsWithLastMessage);
      setError(null);
    } catch (err: any) {
      console.error('[AdminCustomerService] Error in fetchConversations:', err);
      setError('Failed to fetch conversations: ' + (err?.message || 'Unknown error'));
      setConversations([]);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = async (conversationId: string, isPolling = false) => {
    if (!conversationId) return;

    if (isPolling && isFetchingRef.current) {
      console.log('[AdminCustomerService] Skipping polling: already fetching');
      return;
    }

    isFetchingRef.current = true;

    if (!isPolling) {
      setIsLoading(true);
    }

    console.log('[AdminCustomerService] Fetching messages for conversation:', conversationId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[AdminCustomerService] Supabase error:', error);
        setError('Failed to load messages');
        setMessages([]);
        return;
      }

      console.log('[AdminCustomerService] Fetched', data?.length || 0, 'messages');

      // Track all message IDs to prevent duplicates
      data?.forEach(msg => processedMessageIds.current.add(msg.id));

      // Transform messages to match the expected format
      const transformedMessages = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        user_id: msg.sender === 'user' ? 'user' : 'admin',
        content: msg.message,
        created_at: msg.created_at,
        attachment_url: msg.attachment_url,
        attachment_type: msg.attachment_type,
        attachment_name: msg.attachment_name,
        attachment_size: msg.attachment_size
      }));

      setMessages(transformedMessages);

    } catch (err) {
      console.error('[AdminCustomerService] Error in fetchMessages:', err);
    } finally {
      isFetchingRef.current = false;
      setIsSending(false);
      return;
    }
  }

  // Update conversation status
  const updateConversationStatus = async (convId: string, newStatus: 'open' | 'pending' | 'closed') => {
    console.log('[AdminCustomerService] Updating conversation status:', convId, '->', newStatus);
    setIsUpdatingStatus(true);
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', convId);

      if (error) {
        console.error('[AdminCustomerService] Error updating conversation status:', error);
        toast.error('Failed to update conversation status');
        return;
      }

      console.log('[AdminCustomerService] Conversation status updated to:', newStatus);
      toast.success(`Conversation marked as ${newStatus}`);
      fetchConversations();
      
      // Update selected conversation if it's the current one
      if (selectedConversation?.id === convId) {
        setSelectedConversation(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('[AdminCustomerService] Error updating status:', err);
      toast.error('Failed to update conversation status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Legacy close function (now uses updateConversationStatus)
  const closeConversation = async (convId: string) => {
    await updateConversationStatus(convId, 'closed');
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      // Delete messages first (cascade will handle this, but being explicit)
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', convId);

      // Delete conversation
      const { error } = await supabase
        .from('conversations')
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

  
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Unlock className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <Lock className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
            <div>
              <h2 className="text-xl font-bold text-slate-900">Customer Support</h2>
              <p className="text-slate-500 text-sm">
                {conversations.length} total • {conversations.filter(c => c.status === 'open').length} open • {conversations.filter(c => c.status === 'pending').length} pending
              </p>
            </div>
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
                  {/* Status Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeClass(selectedConversation.status)} hidden sm:flex`}>
                    {getStatusIcon(selectedConversation.status)}
                    <span className="capitalize">{selectedConversation.status}</span>
                  </div>
                  
                  <button
                    onClick={() => fetchMessages(selectedConversation.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    title="Refresh"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  
                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedConversation.status}
                      onChange={(e) => updateConversationStatus(selectedConversation.id, e.target.value as any)}
                      disabled={isUpdatingStatus}
                      className="px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                      title="Change status"
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => deleteConversation(selectedConversation.id)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex-shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-medium hidden lg:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 bg-slate-800/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isAdmin = msg.user_id === 'admin';
                    const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.user_id !== msg.user_id;
                    
                    return (
                      <div 
                        key={msg.id || index} 
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[75%] ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}>
                          <div className={`p-3 rounded-2xl ${
                            isAdmin 
                              ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-md' 
                              : 'bg-slate-700 border border-slate-600 text-slate-100 rounded-bl-md'
                          }`}>
                            {/* Attachment display */}
                            {msg.attachment_url && (
                              <div className="mb-2">
                                {msg.attachment_type?.startsWith('image/') ? (
                                  <a 
                                    href={msg.attachment_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-colors"
                                  >
                                    <img 
                                      src={msg.attachment_url} 
                                      alt={msg.attachment_name || 'Attachment'}
                                      className="max-w-full max-h-48 object-cover"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  <a 
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all"
                                  >
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <div className="text-left">
                                      <p className="text-white text-sm font-medium truncate max-w-[200px]">
                                        {msg.attachment_name || 'Document'}
                                      </p>
                                      <p className="text-white/50 text-xs">
                                        {msg.attachment_size ? formatFileSize(msg.attachment_size) : 'File'}
                                      </p>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content || "No content"}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-slate-500 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <span>{isAdmin ? 'You' : 'Customer'}</span>
                            <span>•</span>
                            <span>{formatTime(msg.created_at)}</span>
                            {isAdmin && <CheckCheck className="w-3 h-3 text-pink-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-2 md:p-4 border-t border-white/10">
                {selectedConversation.status === 'closed' ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <Lock className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">This conversation is closed. Change status to reply.</span>
                  </div>
                ) : (
                  <>
                    {/* Attachment Preview */}
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-white/10 rounded-xl border border-white/20">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {attachmentPreview ? (
                              <img 
                                src={attachmentPreview} 
                                alt="Preview" 
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <FileText className="w-12 h-12 text-blue-400" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-white/60 text-xs">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={clearAttachment}
                            disabled={isUploading}
                            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {isUploading && (
                          <div className="mt-2 flex items-center gap-2 text-white/60 text-xs">
                            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            Uploading file...
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 md:gap-3">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      {/* Attachment Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending || isUploading}
                        className="px-3 py-2 md:px-4 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Attach file (JPG, PNG, WEBP, PDF - Max 10MB)"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      
                      {/* Message Input */}
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && !isSending && sendReply()
                        }
                        placeholder="Type your reply..."
                        disabled={isSending || isUploading}
                        className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all"
                      />
                      
                      {/* Send Button */}
                      <button
                        onClick={sendReply}
                        disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                        className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
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
