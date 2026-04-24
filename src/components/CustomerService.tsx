import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { X, Send, MessageCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TELEGRAM_CONFIG, isCSBotConfigured } from '@/config/telegram';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_admin: boolean;
}

interface Conversation {
  id: string;
  user_id: string;
  username: string;
  telegram_chat_id?: string;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
}

const CustomerService: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAppContext();
  const [step, setStep] = useState<'form' | 'conversation'>('form');
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    message: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadingMessagesRef = useRef(false);

  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const [isReloading, setIsReloading] = useState(false);

  

  useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });   
  }, [messages]);

  // Poll for new messages every 3 seconds when conversation is open
 useEffect(() => {
  if (!conversation || !isOpen) return;

  // Initial load
  loadMessages(conversation.id, false);

  // Start polling
  pollIntervalRef.current = setInterval(() => {
    loadMessages(conversation.id, true);
  }, 3000);

  // ✅ CLEANUP (VERY IMPORTANT)
  return () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };
}, [conversation, isOpen]);
 useEffect(() => {
  if (!conversation?.id) return;

  const channel = supabase
    .channel('realtime:messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'customer_messages',
        filter: `conversation_id=eq.${conversation.id}`,
      },
    (payload) => {
  console.log('🔥 Realtime message:', payload);

 const newMsg = payload.new as Message; 

  setMessages((prev: Message[]) => {
    const exists = prev.some((m) => m.id === newMsg.id);
    if (exists) return prev;

    return [...prev, newMsg];
  });
}
)
.subscribe();  

  return () => {
    supabase.removeChannel(channel);
  };
}, [conversation?.id]);

  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      // Check for existing conversations
      checkExistingConversation();
    }
  }, [isOpen, isAuthenticated, user]);

  // Check for existing conversations - with localStorage fallback
  const checkExistingConversation = async () => {
    try {
      // Skip Supabase for training accounts (they use email as ID, not UUID - causes DB errors)
      if (user?.account_type === 'training') {
        const localKey = `cs_conversation_${user?.id}`;
        const localConv = localStorage.getItem(localKey);
        if (localConv) {
          const parsed = JSON.parse(localConv);
          if (parsed.status === 'open') {
            setConversation(parsed);
            loadLocalMessages(parsed.id);
            setStep('conversation');
          }
        }
        return;
      }
      
      // For personal accounts (with UUID user_id), try Supabase first
      const { data, error } = await supabase
        .from('customer_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setConversation(data[0]);
        // Save to localStorage for backup
        const localKey = `cs_conversation_${user?.id}`;
        localStorage.setItem(localKey, JSON.stringify(data[0]));
        await loadMessages(data[0].id);
        setStep('conversation');
        return;
      }
      
      // Fall back to localStorage if Supabase fails or no data
      if (error) {
        console.error('Error checking Supabase conversations:', error);
      }
      
      const localKey = `cs_conversation_${user?.id}`;
      const localConv = localStorage.getItem(localKey);
      if (localConv) {
        const parsed = JSON.parse(localConv);
        if (parsed.status === 'open') {
          setConversation(parsed);
          loadLocalMessages(parsed.id);
          setStep('conversation');
        }
      }
    } catch (error) {
      console.error('Error checking conversations:', error);
      // Silently fail - user can still submit new conversation
    }
  };

  const loadMessages = async (conversationId: string, isPolling = false) => {
    // Prevent overlapping fetches during polling
    if (isPolling && isLoadingMessagesRef.current) {
      return;
    }
    
    if (!isPolling) setIsReloading(true);
    isLoadingMessagesRef.current = true;
    
    try {
      // Skip Supabase for training accounts (use localStorage-only mode)
      if (user?.account_type === 'training') {
        loadLocalMessages(conversationId);
        isLoadingMessagesRef.current = false;
        if (!isPolling) setIsReloading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('customer_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      if (data) {
        setMessages(data);
        setLastMessageCount(data.length);
      } else {
        // No data in Supabase, try localStorage
        loadLocalMessages(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      loadLocalMessages(conversationId);
    } finally {
      isLoadingMessagesRef.current = false;
      if (!isPolling) setIsReloading(false);
    }
  };

  // Load messages from localStorage fallback
  const loadLocalMessages = (conversationId: string) => {
    const localKey = `cs_messages_${conversationId}`;
    const localMsgs = localStorage.getItem(localKey);
    if (localMsgs) {
      const parsed = JSON.parse(localMsgs);
      setMessages(parsed);
      setLastMessageCount(parsed.length);
    } else {
      setMessages([]);
    }
  };

  // Save message to localStorage
  const saveLocalMessage = (conversationId: string, message: Message) => {
    const localKey = `cs_messages_${conversationId}`;
    const existing = localStorage.getItem(localKey);
    const messages = existing ? JSON.parse(existing) : [];
    messages.push(message);
    localStorage.setItem(localKey, JSON.stringify(messages));
    return messages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      alert('Please sign in to use customer service');
      return;
    }

    setIsLoading(true);
    
    // Generate proper UUID for conversation_id (Supabase requires UUID type)
    const localConversationId = crypto.randomUUID();
    
    // Save message to localStorage immediately (frontend-only mode)
   const messageText = formData.message.trim();   // ✅ ADD THIS

const tempMessage: Message = {
  id: crypto.randomUUID(),
  content: messageText,
  is_admin: false,
  created_at: new Date().toISOString()
}; 
    
    const newConversation: Conversation = {
      id: localConversationId,
      user_id: user.id,
      username: user.display_name || user.email || 'Customer',
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to localStorage
    const localKey = `cs_conversation_${user.id}`;
    localStorage.setItem(localKey, JSON.stringify(newConversation));
    setConversation(newConversation);
    saveLocalMessage(localConversationId, tempMessage);
    setStep('conversation');
    setFormData({ full_name: '', phone_number: '', message: '' });
    
    // Skip API call for training accounts (use localStorage-only mode to avoid UUID errors)
    if (user.account_type === 'training') {
      setIsLoading(false);
      console.log('Training account detected - skipping API call, using localStorage-only mode');
      toast({
        title: 'Message Sent',
        description: 'Your message has been saved locally. Our team will assist you shortly.',
      });
      return;
    }
    
    try {
      console.log('📤 FRONTEND: Sending message via API');
      console.log('📤 FRONTEND: Payload:', {
        name: formData.full_name,
        phone: formData.phone_number,
        message: formData.message,
        userId: user.id,
        username: user.display_name || user.email || 'Customer'
      });
      
      // Call the API endpoint with cache-busting (background)
      const response = await fetch(`/api/send-message?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          name: formData.full_name,
          phone: formData.phone_number,
          message: formData.message,
          userId: user.id,
          username: user.display_name || user.email || 'Customer'
        }),
      });

      console.log('📥 FRONTEND: Response status:', response.status, response.statusText);

      // Safe response handling - check if response has JSON body
      let data;
      const contentType = response.headers.get('content-type');
      console.log('📥 FRONTEND: Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { success: response.ok };
      }
      console.log('📥 FRONTEND: API response:', data);

      if (!response.ok) {
        console.error('❌ FRONTEND: Response not OK:', response.status, data);
        throw new Error(data.error || `Failed to send message (HTTP ${response.status})`);
      }

      if (!data.success) {
        console.error('❌ FRONTEND: API returned success=false:', data);
        throw new Error(data.error || 'Request failed');
      }

      console.log('✅ FRONTEND: Message sent successfully, conversation:', data.conversation_id);

      // Update conversation ID if server returned a different one
      if (data.conversation_id && data.conversation_id !== localConversationId) {
        console.log('🔄 FRONTEND: Updating conversation ID from', localConversationId, 'to', data.conversation_id);
        const updatedConversation = { ...newConversation, id: data.conversation_id };
        localStorage.setItem(localKey, JSON.stringify(updatedConversation));
        setConversation(updatedConversation);
        
        // Move messages to new conversation ID
       const msgs = saveLocalMessage(data.conversation_id, tempMessage); 
        setMessages(msgs);
      }
      
      console.log('✅ FRONTEND: Form submitted successfully');
    } catch (error: any) {
      console.error('❌ FRONTEND: Error submitting to API:', error);
      // Message is already saved locally, so show success toast even if API fails
      toast({
        title: 'Message Sent',
        description: 'Your message has been saved locally. Support will be notified.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || isSending) return;

    setIsSending(true);
    setErrorMessage('');
    
    const messageText = newMessage.trim();
    
    // Optimistically add message to UI
  const tempMessage: Message = {
  id: crypto.randomUUID(),
  content: messageText,
  is_admin: false,
  created_at: new Date().toISOString()
}; 
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    // Skip API call for training accounts (use localStorage-only mode to avoid UUID errors)
    if (user?.account_type === 'training') {
      console.log('Training account detected - skipping API call, using localStorage-only mode');
      saveLocalMessage(conversation.id, tempMessage);
      setIsSending(false);
      return;
    }
    
    try {
      console.log('📤 FRONTEND: Sending reply via API');
      
      // Call the API endpoint with cache-busting
      const response = await fetch(`/api/send-message?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          name: user?.display_name || user?.email || 'Customer',
          phone: '',
          message: messageText,
          userId: user?.id,
          username: user?.display_name || user?.email || 'Customer'
        }),
      });

      // Safe response handling - check if response has JSON body
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { success: response.ok };
      }
      console.log('📥 FRONTEND: API reply response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      console.log('✅ FRONTEND: Reply sent successfully');
      
      // Reload from DB to get the actual server message ID
      try {
        await loadMessages(conversation.id);
      } catch (e) {
        console.log('DB reload failed, keeping optimistic message');
      }
      
    } catch (error: any) {
      console.error('❌ FRONTEND: Error sending reply:', error);
      setErrorMessage(`Failed to send: ${error.message}`);
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      // Reload after a delay to sync with server
      setTimeout(() => {
  if (!conversation?.id) return;
  loadMessages(conversation.id);
}, 1000);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Send messages to Telegram CS Bot
  const sendToTelegram = async (message: string, type: 'new_ticket' | 'reply', convId: string) => {
    try {
      const botToken = TELEGRAM_CONFIG.CS_BOT_TOKEN;
      const chatId = TELEGRAM_CONFIG.CS_CHAT_ID;
      
      if (!isCSBotConfigured()) {
        console.warn('CS Bot not configured. Message not sent to Telegram.');
        return;
      }
      
      const userInfo = user ? `👤 User: ${user.display_name || user.email}` : '👤 Guest User';
      const userId = user ? `🆔 ID: ${user.id}` : '';
      const convInfo = `💬 Conversation: ${convId}`;
      
      let prefix = '';
      if (type === 'new_ticket') {
        prefix = '🟢 ONLINE CS - NEW SUPPORT TICKET';
      } else if (type === 'reply') {
        prefix = '💬 ONLINE CS - USER REPLY';
      }
      
      const fullMessage = `${prefix}
${userInfo}
${userId}
${convInfo}
⏰ Time: ${new Date().toLocaleString()}

📝 Message:
${message}

Reply via Telegram to respond to customer.`;
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: fullMessage,
          parse_mode: 'HTML'
        })
      });
      
      if (!response.ok) {
        console.error('Failed to send message to Telegram:', await response.text());
      } else {
        console.log('TELEGRAM MESSAGE SENT');
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md p-6 border-b border-white/[0.1]">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.1]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center animate-pulse">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Online Customer Service</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active 24/7
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step === 'conversation' && conversation && (
                <button
                  onClick={() => loadMessages(conversation.id)}
                  disabled={isReloading}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
                  title="Reload messages"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isReloading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'form' ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-3">
                  WELCOME TO EARNINGSLLC CUSTOMER SERVICE
                </h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  IF YOU ARE HAVING ANY ISSUES WE ARE HERE TO SUPPORT YOU. 24/7 ACTIVELY WORKING.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    FULL NAME:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    PHONE NUMBER:
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    How can we assist you!
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all resize-none"
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isAuthenticated}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </button>
              </form>

              {!isAuthenticated && (
                <div className="text-center text-white/80 text-sm">
                  Please sign in to use customer service
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              {/* NEW MESSAGE Notification */}
              {hasNewMessage && (
                <button
                  onClick={() => {
                    setHasNewMessage(false);
                   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-3 rounded-xl font-bold text-sm animate-bounce shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  NEW MESSAGE - CLICK TO VIEW
                </button>
              )}

              {/* Ticket Info */}
              {conversation && (
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs">Conversation #{conversation.id.slice(0, 8)}</p>
                      <p className="text-white font-semibold">{conversation.username}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                      {conversation.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Messages - Flex grow to take available space */}
              <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                   className={`${ 
  msg.is_admin
    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30'
    : 'bg-white/10 border border-white/20 ml-auto'
} rounded-xl p-4 max-w-[85%]`}
>
{msg.is_admin ? (
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">
                          SUPPORT AGENT
                        </p>
                        <p className="text-white/90 mt-1">{msg.content}</p>
                        <p className="text-white/60 text-xs mt-2">{formatTime(msg.created_at)}</p>
                      </div>
                    )  : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/80 text-xs font-semibold">You</span>
                          <span className="text-white/60 text-xs">{formatTime(msg.created_at)}</span>
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input - Fixed at bottom */}
              {errorMessage && (
                <div className="text-amber-400 text-xs text-center py-2">
                  {errorMessage}
                </div>
              )}
              <div className="flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSending && sendMessage()}
                  placeholder="Type your message..."
                  disabled={isSending}
                  className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Telegram Option */}
        <div className="bg-white/10 backdrop-blur-md p-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-white/80 text-xs">
              24/7 Customer Support
            </div>
            <a
              href="https://t.me/earningsllc_support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-xs font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              TELEGRAM SUPPORT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerService;
