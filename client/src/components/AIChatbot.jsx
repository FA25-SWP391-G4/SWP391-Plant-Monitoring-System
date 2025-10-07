import React, { useState, useRef, useEffect } from 'react';
import aiApi from '../api/aiApi';
import { Box, TextField, Button, Typography, Paper, Avatar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: 'Xin chào! Tôi là trợ lý AI chăm sóc cây trồng. Tôi có thể giúp gì cho bạn?', 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send to AI service
      const response = await aiApi.chatWithAI({
        message: input,
        conversation_history: messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      });
      
      // Add bot response
      const botMessage = {
        id: messages.length + 2,
        text: response.data.response,
        sender: 'bot'
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
        sender: 'bot',
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper elevation={3} sx={{ height: '500px', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Trợ lý AI chăm sóc cây trồng
      </Typography>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        mb: 2, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 1,
        p: 1
      }}>
        {messages.map((message) => (
          <Box 
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              maxWidth: '70%',
              alignItems: 'flex-start',
              flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                  mr: message.sender === 'user' ? 0 : 1,
                  ml: message.sender === 'user' ? 1 : 0
                }}
              >
                {message.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
              </Avatar>
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
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <SmartToyIcon />
              </Avatar>
              <CircularProgress size={24} />
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Nhập câu hỏi về chăm sóc cây trồng..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          multiline
          maxRows={3}
        />
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<SendIcon />}
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          Gửi
        </Button>
      </Box>
    </Paper>
  );
};

export default AIChatbot;