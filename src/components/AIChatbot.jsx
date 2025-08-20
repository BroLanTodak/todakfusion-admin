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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.welcomeMessage}>
                <p>Hi! I'm Todak AI, your intelligent business planning assistant. I can:</p>
                <ul>
                  <li>📖 Read and analyze your current vision & mission</li>
                  <li>🎯 Review your OKRs and suggest improvements</li>
                  <li>📊 Analyze your SWOT and provide insights</li>
                  <li>💡 Help with your business model canvas</li>
                  <li>🔍 Access your saved data to give contextual advice</li>
                </ul>
                <p>Ask me anything about your business plan!</p>
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
