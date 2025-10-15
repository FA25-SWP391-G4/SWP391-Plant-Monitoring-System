import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Message as MessageIcon,
  BugReport as BugReportIcon,
  Opacity as OpacityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useMqttContext } from '../contexts/MqttContext';
import MqttConnectionStatus from './MqttConnectionStatus';
import MqttSubscriptionManager from './MqttSubscriptionManager';

/**
 * MQTT Integration Demo Component
 * Demonstrates all MQTT features for AI integration
 */
const MqttIntegrationDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [testUserId, setTestUserId] = useState('123');
  const [testPlantId, setTestPlantId] = useState('456');
  const [testMessage, setTestMessage] = useState('How is my plant doing?');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [isDemo, setIsDemo] = useState(false);

  const {
    isConnected,
    connectionStatus,
    aiTopics,
    messages,
    clearMessages
  } = useMqttContext();

  // Demo message handlers
  useEffect(() => {
    const handleChatbotResponse = (messageData) => {
      setReceivedMessages(prev => [...prev, {
        type: 'chatbot-response',
        topic: messageData.topic,
        data: messageData.message,
        timestamp: messageData.timestamp
      }]);
    };

    const handleDiseaseAnalysis = (messageData) => {
      setReceivedMessages(prev => [...prev, {
        type: 'disease-analysis',
        topic: messageData.topic,
        data: messageData.message,
        timestamp: messageData.timestamp
      }]);
    };

    const handleIrrigationPrediction = (messageData) => {
      setReceivedMessages(prev => [...prev, {
        type: 'irrigation-prediction',
        topic: messageData.topic,
        data: messageData.message,
        timestamp: messageData.timestamp
      }]);
    };

    // Subscribe to demo topics if connected
    if (isConnected && isDemo) {
      aiTopics.chatbot.subscribe(testUserId, handleChatbotResponse);
      aiTopics.disease.subscribe(testPlantId, handleDiseaseAnalysis);
      aiTopics.irrigation.subscribe(testPlantId, handleIrrigationPrediction);
    }
  }, [isConnected, isDemo, testUserId, testPlantId, aiTopics]);

  const handleStartDemo = async () => {
    if (!isConnected) return;
    
    setIsDemo(true);
    setReceivedMessages([]);
    
    // Subscribe to all demo topics
    await Promise.all([
      aiTopics.chatbot.subscribe(testUserId),
      aiTopics.chatbot.subscribeTyping(testUserId),
      aiTopics.disease.subscribe(testPlantId),
      aiTopics.disease.subscribeAlerts(testPlantId),
      aiTopics.irrigation.subscribe(testPlantId),
      aiTopics.irrigation.subscribeRecommendations(testPlantId),
      aiTopics.irrigation.subscribeAlerts(testPlantId),
      aiTopics.system.subscribeStatus()
    ]);
  };

  const handleStopDemo = () => {
    setIsDemo(false);
  };

  const handleSendChatbotMessage = async () => {
    if (!testMessage.trim()) return;
    
    await aiTopics.chatbot.publish(testUserId, {
      message: testMessage,
      context: {
        plantId: testPlantId,
        timestamp: new Date().toISOString()
      }
    });
    
    setTestMessage('');
  };

  const handleSendDiseaseRequest = async () => {
    await aiTopics.disease.publish(testPlantId, {
      imageData: 'base64_mock_image_data',
      metadata: {
        userId: testUserId,
        imageSize: '1024x768',
        capturedAt: new Date().toISOString()
      }
    });
  };

  const handleSendIrrigationRequest = async () => {
    await aiTopics.irrigation.publish(testPlantId, {
      sensorData: {
        soilMoisture: 35,
        temperature: 24,
        humidity: 65,
        lightLevel: 800
      },
      options: {
        userId: testUserId,
        urgency: 'normal'
      }
    });
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'chatbot-response':
        return <MessageIcon color="primary" />;
      case 'disease-analysis':
        return <BugReportIcon color="secondary" />;
      case 'irrigation-prediction':
        return <OpacityIcon color="info" />;
      default:
        return <MessageIcon />;
    }
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'chatbot-response':
        return 'primary';
      case 'disease-analysis':
        return 'secondary';
      case 'irrigation-prediction':
        return 'info';
      default:
        return 'default';
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="MQTT Integration Demo"
              subheader="Test and monitor MQTT communication for AI features"
              action={<MqttConnectionStatus variant="chip" />}
            />
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="AI Testing" />
                <Tab label="Message Monitor" />
                <Tab label="Subscriptions" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    AI Features Testing
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="Test User ID"
                        value={testUserId}
                        onChange={(e) => setTestUserId(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Test Plant ID"
                        value={testPlantId}
                        onChange={(e) => setTestPlantId(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 3 }}>
                    <Button
                      variant={isDemo ? "outlined" : "contained"}
                      color={isDemo ? "secondary" : "primary"}
                      onClick={isDemo ? handleStopDemo : handleStartDemo}
                      disabled={!isConnected}
                      startIcon={isDemo ? <StopIcon /> : <PlayArrowIcon />}
                      sx={{ mr: 2 }}
                    >
                      {isDemo ? 'Stop Demo' : 'Start Demo'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setReceivedMessages([])}
                      startIcon={<ClearIcon />}
                    >
                      Clear Messages
                    </Button>
                  </Box>

                  {isDemo && (
                    <Grid container spacing={2}>
                      {/* Chatbot Testing */}
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            AI Chatbot Testing
                          </Typography>
                          <Box display="flex" gap={1}>
                            <TextField
                              label="Test Message"
                              value={testMessage}
                              onChange={(e) => setTestMessage(e.target.value)}
                              size="small"
                              fullWidth
                              onKeyPress={(e) => e.key === 'Enter' && handleSendChatbotMessage()}
                            />
                            <Button
                              variant="contained"
                              onClick={handleSendChatbotMessage}
                              disabled={!testMessage.trim()}
                              startIcon={<SendIcon />}
                            >
                              Send
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>

                      {/* Disease Detection Testing */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Disease Detection
                          </Typography>
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleSendDiseaseRequest}
                            startIcon={<BugReportIcon />}
                            fullWidth
                          >
                            Send Mock Image Analysis
                          </Button>
                        </Paper>
                      </Grid>

                      {/* Irrigation Prediction Testing */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Irrigation Prediction
                          </Typography>
                          <Button
                            variant="contained"
                            color="info"
                            onClick={handleSendIrrigationRequest}
                            startIcon={<OpacityIcon />}
                            fullWidth
                          >
                            Request Prediction
                          </Button>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Received Messages ({receivedMessages.length})
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setReceivedMessages([])}
                      startIcon={<ClearIcon />}
                    >
                      Clear
                    </Button>
                  </Box>

                  {receivedMessages.length === 0 ? (
                    <Alert severity="info">
                      No messages received yet. Start the demo and send some test messages.
                    </Alert>
                  ) : (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {receivedMessages.slice().reverse().map((msg, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemIcon>
                              {getMessageIcon(msg.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip
                                    label={msg.type}
                                    size="small"
                                    color={getMessageColor(msg.type)}
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {msg.topic}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                  </Typography>
                                  <Box sx={{ 
                                    mt: 1, 
                                    p: 1, 
                                    backgroundColor: 'grey.50', 
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem'
                                  }}>
                                    {JSON.stringify(msg.data, null, 2)}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < receivedMessages.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <MqttSubscriptionManager />
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Connection Status */}
            <Grid item xs={12}>
              <MqttConnectionStatus variant="detailed" />
            </Grid>

            {/* Quick Stats */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Quick Stats" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Connection Status"
                        secondary={connectionStatus}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Demo Active"
                        secondary={isDemo ? 'Yes' : 'No'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Messages Received"
                        secondary={receivedMessages.length}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Test User ID"
                        secondary={testUserId}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Test Plant ID"
                        secondary={testPlantId}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MqttIntegrationDemo;