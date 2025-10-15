import { useState, useEffect, useCallback } from 'react';
import aiApi from '../api/aiApi';

/**
 * Custom hook for managing chat sessions and conversation history
 */
const useChatSession = (userId, plantId = null) => {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate a new session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Start a new chat session
  const startNewSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setCurrentSessionId(newSessionId);
    setChatHistory([{
      id: 1,
      text: 'Xin chào! Tôi là trợ lý AI chăm sóc cây trồng. Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      sessionId: newSessionId
    }]);
    setError(null);
    
    console.log('🆕 Started new chat session:', newSessionId);
    return newSessionId;
  }, [generateSessionId]);

  // Load chat history for a session
  const loadChatHistory = useCallback(async (sessionId) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📚 Loading chat history for session:', sessionId);
      const response = await aiApi.getChatHistory(sessionId);
      
      if (response.data.success) {
        const history = response.data.history.map((item, index) => ({
          id: index + 1,
          text: item.user_message || item.ai_response,
          sender: item.user_message ? 'user' : 'bot',
          timestamp: item.timestamp,
          sessionId: sessionId,
          confidence: item.confidence,
          plantContext: item.plant_context
        }));

        setChatHistory(history);
        setCurrentSessionId(sessionId);
        console.log('✅ Chat history loaded successfully:', history.length, 'messages');
      } else {
        throw new Error('Failed to load chat history');
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      setError(error.message);
      
      // If loading fails, start a new session
      startNewSession();
    } finally {
      setIsLoading(false);
    }
  }, [startNewSession]);

  // Load user's chat sessions
  const loadChatSessions = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📋 Loading chat sessions for user:', userId);
      const response = await aiApi.getChatSessions(userId);
      
      if (response.data.success) {
        setSessions(response.data.sessions);
        console.log('✅ Chat sessions loaded successfully:', response.data.sessions.length, 'sessions');
      } else {
        throw new Error('Failed to load chat sessions');
      }
    } catch (error) {
      console.error('❌ Error loading chat sessions:', error);
      setError(error.message);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Delete a chat session
  const deleteSession = useCallback(async (sessionId) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🗑️ Deleting chat session:', sessionId);
      const response = await aiApi.deleteSession(sessionId);
      
      if (response.data.success) {
        // Remove from sessions list
        setSessions(prev => prev.filter(session => session.session_id !== sessionId));
        
        // If it's the current session, start a new one
        if (sessionId === currentSessionId) {
          startNewSession();
        }
        
        console.log('✅ Chat session deleted successfully');
        return true;
      } else {
        throw new Error('Failed to delete chat session');
      }
    } catch (error) {
      console.error('❌ Error deleting chat session:', error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, startNewSession]);

  // Add a message to current chat history
  const addMessage = useCallback((message) => {
    setChatHistory(prev => [...prev, {
      ...message,
      id: prev.length + 1,
      timestamp: message.timestamp || new Date().toISOString(),
      sessionId: currentSessionId
    }]);
  }, [currentSessionId]);

  // Update the last message (useful for streaming responses)
  const updateLastMessage = useCallback((updates) => {
    setChatHistory(prev => {
      const newHistory = [...prev];
      const lastIndex = newHistory.length - 1;
      if (lastIndex >= 0) {
        newHistory[lastIndex] = { ...newHistory[lastIndex], ...updates };
      }
      return newHistory;
    });
  }, []);

  // Clear current chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([{
      id: 1,
      text: 'Xin chào! Tôi là trợ lý AI chăm sóc cây trồng. Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      sessionId: currentSessionId
    }]);
  }, [currentSessionId]);

  // Get session summary
  const getSessionSummary = useCallback((sessionId) => {
    const session = sessions.find(s => s.session_id === sessionId);
    if (!session) return null;

    return {
      id: session.session_id,
      lastMessage: session.last_message,
      messageCount: session.message_count,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      plantId: session.plant_id
    };
  }, [sessions]);

  // Initialize session on mount
  useEffect(() => {
    if (userId && !currentSessionId) {
      // Try to load existing sessions first
      loadChatSessions().then(() => {
        // If no current session, start a new one
        if (!currentSessionId) {
          startNewSession();
        }
      });
    }
  }, [userId, currentSessionId, loadChatSessions, startNewSession]);

  return {
    // Session state
    currentSessionId,
    sessions,
    chatHistory,
    isLoading,
    error,

    // Session management
    startNewSession,
    loadChatHistory,
    loadChatSessions,
    deleteSession,

    // Message management
    addMessage,
    updateLastMessage,
    clearChatHistory,

    // Utilities
    getSessionSummary,
    
    // Session info
    hasActiveSessions: sessions.length > 0,
    messageCount: chatHistory.length
  };
};

export default useChatSession;