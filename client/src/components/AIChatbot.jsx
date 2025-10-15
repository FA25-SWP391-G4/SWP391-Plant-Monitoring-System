import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Avatar, 
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Alert,
  Badge,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon
} from '@mui/icons-material';

// Import custom hooks and context
import { useMqttContext } from '../contexts/MqttContext';
import useChatSession from '../hooks/useChatSession';
import useSensorData from '../hooks/useSensorData';
import aiApi from '../api/aiApi';
import MqttConnectionStatus from './MqttConnectionStatus';

const AIChatbot = ({ 
  userId = 1, 
  plantId = 1, 
  height = '600px',
  showSensorData = true,
  showSessionHistory = true 
}) => {
  // State management
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSensorPanel, setShowSensorPanel] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // MQTT Context
  const { 
    isConnected: mqttConnected, 
    connectionStatus, 
    aiTopics,
    error: mqttError 
  } = useMqttContext();

  const {
    currentSessionId,
    sessions,
    chatHistory,
    isLoading: sessionLoading,
    error: sessionError,
    startNewSession,
    loadChatSessions,
    deleteSession,
    addMessage
  } = useChatSession(userId, plantId);

  const {
    sensorData,
    plantInfo,
    wateringHistory,
    getFormattedSensorData,
    getPlantHealthSummary,
    isConnected: sensorConnected,
    lastUpdate
  } = useSensorData(plantId);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]);

  // Handle MQTT real-time responses
  useEffect(() => {
    if (!mqttConnected || !userId) return;

    const responseTopicPattern = `ai/chatbot/response/${userId}`;
    const typingTopicPattern = `ai/chatbot/typing/${userId}`;

    console.log('📡 Subscribing to chatbot MQTT topics for user:', userId);

    // Subscribe to chatbot responses
    subscribe(responseTopicPattern, (messageData) => {
      try {
        const { message } = messageData;
        console.log('🤖 Received AI response via MQTT:', message);

        const botMessage = {
          text: message.response,
          sender: 'bot',
          confidence: message.confidence,
          plantContext: message.plantContext,
          fallback: message.fallback,
          timestamp: message.timestamp
        };

        addMessage(botMessage);
        setIsLoading(false);
        setIsTyping(false);
      } catch (error) {
        console.error('❌ Error processing MQTT chatbot response:', error);
      }
    });

    // Subscribe to typing indicators
    subscribe(typingTopicPattern, (messageData) => {
      try {
        const { message } = messageData;
        setIsTyping(message.typing);
      } catch (error) {
        console.error('❌ Error processing MQTT typing indicator:', error);
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribe(responseTopicPattern);
      unsubscribe(typingTopicPattern);
    };
  }, [mqttConnected, userId, subscribe, unsubscribe, addMessage]);

  // Handle connection errors
  useEffect(() => {
    if (mqttError || sessionError) {
      setConnectionError(mqttError || sessionError);
    } else {
      setConnectionError(null);
    }
  }, [mqttError, sessionError]);

  // Send message handler
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      text: input.trim(),
      sender: 'user'
    };
    
    // Add user message immediately
    addMessage(userMessage);
    const messageText = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      console.log('💬 Sending message to AI service:', messageText);
      
      // Send to AI service
      const response = await aiApi.chatWithAI({
        message: messageText,
        userId: userId,
        plantId: plantId,
        sessionId: currentSessionId,
        language: 'vi'
      });
      
      console.log('✅ AI service response received:', response.data);
      
      // If MQTT is not connected, add response directly
      if (!mqttConnected && response.data.success) {
        const botMessage = {
          text: response.data.response,
          sender: 'bot',
          confidence: response.data.confidence,
          fallback: response.data.fallback,
          timestamp: response.data.timestamp
        };
        
        addMessage(botMessage);
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
        sender: 'bot',
        isError: true
      };
      
      addMessage(errorMessage);
    } finally {
      if (!mqttConnected) {
        setIsLoading(false);
      }
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle session selection
  const handleSessionSelect = (sessionId) => {
    if (sessionId !== currentSessionId) {
      // Load selected session history
      console.log('📚 Loading session:', sessionId);
      // This would be implemented in the useChatSession hook
    }
    setSessionMenuAnchor(null);
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId, event) => {
    event.stopPropagation();
    const success = await deleteSession(sessionId);
    if (success) {
      console.log('✅ Session deleted successfully');
    }
  };

  // Get formatted sensor data for display
  const formattedSensorData = getFormattedSensorData();
  const plantHealthSummary = getPlantHealthSummary();

  // Render sensor data panel
  const renderSensorPanel = () => {
    if (!showSensorData || !formattedSensorData) return null;

    return (
      <Collapse in={showSensorPanel}>
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Thông tin cây trồng
          </Typography>
          
          {plantInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {plantInfo.name} - {plantInfo.type}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Vị trí: {plantInfo.location}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {Object.entries(formattedSensorData).map(([key, data]) => (
              <Chip
                key={key}
                label={`${data.label}: ${data.value}${data.unit}`}
                color={data.status === 'good' ? 'success' : data.status === 'warning' ? 'warning' : 'error'}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>

          {plantHealthSummary && (
            <Alert 
              severity={plantHealthSummary.status === 'good' ? 'success' : 
                       plantHealthSummary.status === 'warning' ? 'warning' : 'error'}
              sx={{ fontSize: '0.875rem' }}
            >
              {plantHealthSummary.message}
            </Alert>
          )}

          {lastUpdate && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Cập nhật lần cuối: {new Date(lastUpdate).toLocaleString('vi-VN')}
            </Typography>
          )}
        </Paper>
      </Collapse>
    );
  };

  // Render connection status
  const renderConnectionStatus = () => {
    const isFullyConnected = mqttConnected && sensorConnected;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Tooltip title={`MQTT: ${connectionStatus}, Sensor: ${sensorConnected ? 'connected' : 'disconnected'}`}>
          <Badge 
            color={isFullyConnected ? 'success' : 'error'} 
            variant="dot"
          >
            {isFullyConnected ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
          </Badge>
        </Tooltip>
        
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Trợ lý AI chăm sóc cây trồng
        </Typography>

        {showSensorData && (
          <Tooltip title="Thông tin cảm biến">
            <IconButton 
              size="small" 
              onClick={() => setShowSensorPanel(!showSensorPanel)}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        )}

        {showSessionHistory && (
          <Tooltip title="Lịch sử phiên chat">
            <IconButton 
              size="small"
              onClick={(e) => setSessionMenuAnchor(e.currentTarget)}
            >
              <Badge badgeContent={sessions.length} color="primary">
                <HistoryIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Phiên chat mới">
          <IconButton size="small" onClick={startNewSession}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // Render session history menu
  const renderSessionMenu = () => (
    <Menu
      anchorEl={sessionMenuAnchor}
      open={Boolean(sessionMenuAnchor)}
      onClose={() => setSessionMenuAnchor(null)}
      PaperProps={{ sx: { maxHeight: 300, width: 300 } }}
    >
      <MenuItem onClick={() => { startNewSession(); setSessionMenuAnchor(null); }}>
        <RefreshIcon sx={{ mr: 1 }} />
        Phiên chat mới
      </MenuItem>
      <Divider />
      
      {sessions.length === 0 ? (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            Chưa có phiên chat nào
          </Typography>
        </MenuItem>
      ) : (
        sessions.map((session) => (
          <MenuItem 
            key={session.session_id}
            onClick={() => handleSessionSelect(session.session_id)}
            selected={session.session_id === currentSessionId}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" noWrap>
                {session.last_message?.substring(0, 30)}...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(session.updated_at).toLocaleDateString('vi-VN')}
              </Typography>
            </Box>
            <IconButton 
              size="small"
              onClick={(e) => handleDeleteSession(session.session_id, e)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </MenuItem>
        ))
      )}
    </Menu>
  );

  return (
    <Paper elevation={3} sx={{ height, display: 'flex', flexDirection: 'column', p: 2 }}>
      {renderConnectionStatus()}
      {renderSensorPanel()}
      
      {connectionError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Kết nối không ổn định: {connectionError}
        </Alert>
      )}
      
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        mb: 2, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 1,
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1
      }}>
        {chatHistory.map((message, index) => (
          <Box 
            key={`${message.sessionId}-${index}`}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              maxWidth: '85%',
              alignItems: 'flex-start',
              flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                  mr: message.sender === 'user' ? 0 : 1,
                  ml: message.sender === 'user' ? 1 : 0,
                  width: 32,
                  height: 32
                }}
              >
                {message.sender === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
              </Avatar>
              
              <Box>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2,
                    bgcolor: message.sender === 'user' ? 'primary.light' : 'background.paper',
                    color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                    ...(message.isError && { bgcolor: 'error.light', color: 'error.contrastText' })
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Typography>
                  
                  {message.confidence && message.sender === 'bot' && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`Độ tin cậy: ${Math.round(message.confidence * 100)}%`}
                        size="small"
                        variant="outlined"
                        color={message.confidence > 0.8 ? 'success' : 'warning'}
                      />
                      {message.fallback && (
                        <Chip 
                          label="Phản hồi dự phòng"
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      )}
                    </Box>
                  )}
                </Paper>
                
                {message.timestamp && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'block', 
                      mt: 0.5,
                      textAlign: message.sender === 'user' ? 'right' : 'left'
                    }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('vi-VN')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        ))}
        
        {(isLoading || isTyping) && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {isTyping ? 'Đang nhập...' : 'Đang xử lý...'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          ref={inputRef}
          fullWidth
          variant="outlined"
          placeholder="Nhập câu hỏi về chăm sóc cây trồng..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          multiline
          maxRows={3}
          size="small"
        />
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<SendIcon />}
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          sx={{ minWidth: 'auto', px: 2 }}
        >
          Gửi
        </Button>
      </Box>

      {renderSessionMenu()}
    </Paper>
  );
};

export default AIChatbot;