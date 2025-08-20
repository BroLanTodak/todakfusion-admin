import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { chatWithAI } from '../lib/openai';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import { parseAIIntent, executeAIAction, formatActionForConfirmation } from '../lib/aiDatabaseActions';
import styles from './AIChatbot.module.css';

const AIChatbot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load or create conversation when chat opens
  useEffect(() => {
    if (isOpen && user && !conversationId) {
      loadOrCreateConversation();
    }
  }, [isOpen, user]);

  // Load or create a conversation
  const loadOrCreateConversation = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      // Try to get the most recent active conversation
      const { data: conversations, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      let activeConversation;
      
      if (!convError && conversations && conversations.length > 0) {
        // Use existing conversation
        activeConversation = conversations[0];
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            title: `Chat ${new Date().toLocaleDateString()}`,
            status: 'active',
            metadata: {
              startedAt: new Date().toISOString(),
              userAgent: navigator.userAgent
            }
          })
          .select()
          .single();

        if (createError) throw createError;
        activeConversation = newConv;
      }

      setConversationId(activeConversation.id);
      
      // Load messages for this conversation
      await loadMessages(activeConversation.id);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load messages from database
  const loadMessages = async (convId) => {
    try {
      const { data: dbMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (dbMessages && dbMessages.length > 0) {
        // Convert database messages to chat format
        const formattedMessages = dbMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          hasAction: msg.metadata?.hasAction,
          actionPending: msg.metadata?.actionPending,
          actionCompleted: msg.metadata?.actionCompleted
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Save message to database
  const saveMessage = async (message) => {
    if (!conversationId || !user) return;

    try {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          user_id: user.id,
          metadata: {
            hasAction: message.hasAction,
            actionPending: message.actionPending,
            actionCompleted: message.actionCompleted,
            actionFailed: message.actionFailed,
            timestamp: message.timestamp
          }
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Start new conversation
  const startNewConversation = async () => {
    if (!user) return;
    
    // Mark current conversation as completed
    if (conversationId) {
      await supabase
        .from('chat_conversations')
        .update({ status: 'completed' })
        .eq('id', conversationId);
    }
    
    // Clear current messages
    setMessages([]);
    setConversationId(null);
    setPendingAction(null);
    setActionStatus(null);
    
    // Create new conversation
    await loadOrCreateConversation();
  };

  // Get context data based on current page
  const getContextData = async () => {
    const contextData = {
      currentPage: location.pathname,
      data: {}
    };

    try {
      switch (location.pathname) {
        case '/vision-mission':
          // Get vision and mission data
          const { data: visionData } = await supabase
            .from('visions_missions')
            .select('*')
            .eq('is_current', true);
          
          if (visionData) {
            const vision = visionData.find(item => item.type === 'vision');
            const mission = visionData.find(item => item.type === 'mission');
            contextData.data = {
              vision: vision?.content || 'No vision set yet',
              mission: mission?.content || 'No mission set yet'
            };
          }
          break;

        case '/okr':
          // Get current OKRs
          const { data: okrData } = await supabase
            .from('objectives')
            .select(`
              *,
              key_results (*)
            `)
            .eq('status', 'active')
            .limit(5);
          
          contextData.data.okrs = okrData || [];
          break;

        case '/swot':
          // Get SWOT data
          const { data: swotData } = await supabase
            .from('swot_items')
            .select('*')
            .order('category');
          
          contextData.data.swot = swotData || [];
          break;

        case '/canvas':
          // Get canvas blocks
          const { data: canvasData } = await supabase
            .from('canvas_blocks')
            .select('*');
          
          contextData.data.canvas = canvasData || [];
          break;
      }
    } catch (error) {
      console.error('Error getting context data:', error);
    }

    return contextData;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Save user message to database
    await saveMessage(userMessage);

    try {
      // Get current context including database data
      const contextData = await getContextData();
      const context = {
        user: user?.email,
        currentPage: location.pathname,
        pageData: contextData.data,
        timestamp: new Date().toISOString()
      };

      const response = await chatWithAI(input, context);
      
      // Check if AI wants to perform an action
      const intent = parseAIIntent(response);
      
      let aiMessage;
      
      if (intent) {
        // AI wants to perform a database action
        const result = await executeAIAction(
          intent.action, 
          intent.params, 
          user.id,
          true // needs confirmation
        );

        if (result.requiresConfirmation) {
          // Store pending action and show confirmation
          setPendingAction({
            ...intent,
            confirmationData: formatActionForConfirmation(intent.action, intent.params)
          });
          
          aiMessage = {
            role: 'assistant',
            content: response,
            hasAction: true,
            actionPending: true,
            timestamp: new Date().toISOString()
          };
        } else if (result.success) {
          // Action executed successfully
          aiMessage = {
            role: 'assistant',
            content: `${response}\n\n✅ ${result.message}`,
            hasAction: true,
            actionCompleted: true,
            timestamp: new Date().toISOString()
          };
          
          // Refresh page data if needed
          if (window.location.reload) {
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          // Action failed
          aiMessage = {
            role: 'assistant',
            content: `${response}\n\n❌ ${result.error || 'Action failed'}`,
            hasAction: true,
            actionFailed: true,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // Normal response without action
        aiMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        };
      }
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to database
      await saveMessage(aiMessage);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your OpenAI API key.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle action confirmation
  const handleConfirmAction = async () => {
    if (!pendingAction || !user) return;

    setLoading(true);
    try {
      const result = await executeAIAction(
        pendingAction.action,
        pendingAction.params,
        user.id,
        false // don't need confirmation again
      );

      if (result.success) {
        setActionStatus({
          type: 'success',
          message: result.message
        });
        
        // Update last message to show action completed
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.actionPending) {
            lastMessage.actionPending = false;
            lastMessage.actionCompleted = true;
            lastMessage.content += `\n\n✅ ${result.message}`;
          }
          return newMessages;
        });

        // Refresh page after 1.5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setActionStatus({
          type: 'error',
          message: result.error || 'Action failed'
        });
      }
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  // Handle action rejection
  const handleRejectAction = () => {
    setPendingAction(null);
    setActionStatus({
      type: 'info',
      message: 'Action cancelled'
    });

    // Update last message
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.actionPending) {
        lastMessage.actionPending = false;
        lastMessage.content += '\n\n❌ Action cancelled by user';
      }
      return newMessages;
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={styles.chatButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <h3>Todak AI Assistant</h3>
            <div className={styles.headerActions}>
              <button
                className={styles.newChatButton}
                onClick={startNewConversation}
                title="Start new conversation"
              >
                New Chat
              </button>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className={styles.messagesContainer}>
            {loadingHistory ? (
              <div className={styles.loadingHistory}>
                <div className={styles.spinner}></div>
                <p>Loading conversation history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.welcomeMessage}>
                <p>Hi! I'm Todak AI, your intelligent business planning assistant. I can:</p>
                <ul>
                  <li>📖 Read and analyze your current vision & mission</li>
                  <li>🎯 Review your OKRs and suggest improvements</li>
                  <li>📊 Analyze your SWOT and provide insights</li>
                  <li>💡 Help with your business model canvas</li>
                  <li>🔍 Access your saved data to give contextual advice</li>
                  <li>💬 Remember our conversation history</li>
                </ul>
                <p>Ask me anything about your business plan!</p>
                {conversationId && (
                  <p className={styles.sessionInfo}>
                    Continuing previous conversation...
                  </p>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${
                    message.role === 'user' ? styles.userMessage : styles.aiMessage
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Action Confirmation Dialog */}
          {pendingAction && (
            <div className={styles.actionConfirmation}>
              <div className={styles.actionHeader}>
                <AlertCircle size={20} />
                <h4>{pendingAction.confirmationData.title}</h4>
              </div>
              <p className={styles.actionDescription}>
                {pendingAction.confirmationData.description}
              </p>
              <div className={styles.actionContent}>
                "{pendingAction.confirmationData.content}"
              </div>
              {pendingAction.confirmationData.warning && (
                <p className={styles.actionWarning}>
                  ⚠️ {pendingAction.confirmationData.warning}
                </p>
              )}
              <div className={styles.actionButtons}>
                <button
                  onClick={handleConfirmAction}
                  disabled={loading}
                  className={styles.confirmButton}
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={handleRejectAction}
                  disabled={loading}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Status */}
          {actionStatus && (
            <div className={`${styles.actionStatus} ${styles[actionStatus.type]}`}>
              {actionStatus.type === 'success' && <CheckCircle size={16} />}
              {actionStatus.message}
            </div>
          )}

          <div className={styles.inputContainer}>
            <input
              type="text"
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              disabled={loading}
            />
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
