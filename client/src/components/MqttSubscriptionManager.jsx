import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Badge,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useMqttContext } from '../contexts/MqttContext';

/**
 * MQTT Subscription Manager Component
 * Provides advanced topic subscription management and monitoring
 */
const MqttSubscriptionManager = ({ 
  showAddSubscription = true,
  showStatistics = true,
  maxHeight = '400px'
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showMessages, setShowMessages] = useState({});
  
  const {
    isConnected,
    subscriptions,
    messages,
    subscribe,
    unsubscribe,
    messageStats
  } = useMqttContext();

  // Predefined AI topic templates
  const topicTemplates = [
    { 
      name: 'Chatbot Response', 
      pattern: 'ai/chatbot/response/{userId}',
      description: 'AI chatbot responses for specific user'
    },
    { 
      name: 'Chatbot Typing', 
      pattern: 'ai/chatbot/typing/{userId}',
      description: 'Typing indicators from AI chatbot'
    },
    { 
      name: 'Disease Analysis', 
      pattern: 'ai/disease/analysis/{plantId}',
      description: 'Disease detection analysis results'
    },
    { 
      name: 'Disease Alerts', 
      pattern: 'ai/disease/alert/{plantId}',
      description: 'Critical disease detection alerts'
    },
    { 
      name: 'Irrigation Prediction', 
      pattern: 'ai/irrigation/prediction/{plantId}',
      description: 'Irrigation timing predictions'
    },
    { 
      name: 'Irrigation Alerts', 
      pattern: 'ai/irrigation/alert/{plantId}',
      description: 'Urgent irrigation alerts'
    },
    { 
      name: 'System Status', 
      pattern: 'ai/system/status',
      description: 'AI system health and status updates'
    }
  ];

  const handleAddSubscription = async () => {
    if (!newTopic.trim()) return;
    
    try {
      const success = await subscribe(newTopic.trim(), (message) => {
        console.log(`📨 Message received on ${newTopic}:`, message);
      });
      
      if (success) {
        setNewTopic('');
        setAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to add subscription:', error);
    }
  };

  const handleRemoveSubscription = async (topic) => {
    try {
      await unsubscribe(topic);
    } catch (error) {
      console.error('Failed to remove subscription:', error);
    }
  };

  const handleTemplateSelect = (template) => {
    setNewTopic(template.pattern);
  };

  const toggleMessageVisibility = (topic) => {
    setShowMessages(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getSubscriptionStats = (topic) => {
    const subscription = subscriptions.get(topic);
    if (!subscription) return null;

    return {
      messageCount: subscription.messageCount || 0,
      subscribedAt: subscription.subscribedAt,
      lastMessage: subscription.lastMessage
    };
  };

  return (
    <Card>
      <CardHeader
        title="MQTT Subscriptions"
        subheader={`${subscriptions.size} active subscriptions`}
        action={
          showAddSubscription && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              disabled={!isConnected}
              size="small"
            >
              Add
            </Button>
          )
        }
      />
      
      <CardContent>
        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            MQTT client is not connected. Subscriptions will be restored when connection is established.
          </Alert>
        )}

        {showStatistics && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Statistics
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip
                icon={<MessageIcon />}
                label={`${messageStats.totalReceived} received`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<TrendingUpIcon />}
                label={`${messageStats.totalSent} sent`}
                size="small"
                variant="outlined"
              />
              {messageStats.lastActivity && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={`Last: ${formatTimestamp(messageStats.lastActivity)}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ maxHeight, overflow: 'auto' }}>
          {subscriptions.size === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              No active subscriptions
            </Typography>
          ) : (
            <List>
              {Array.from(subscriptions.entries()).map(([topic, subscription]) => {
                const stats = getSubscriptionStats(topic);
                const hasMessages = messages[topic];
                
                return (
                  <React.Fragment key={topic}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" component="span">
                              {topic}
                            </Typography>
                            {stats && stats.messageCount > 0 && (
                              <Badge badgeContent={stats.messageCount} color="primary">
                                <MessageIcon fontSize="small" />
                              </Badge>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Subscribed: {formatTimestamp(subscription.subscribedAt)}
                            </Typography>
                            {stats && stats.lastMessage && (
                              <Typography variant="caption" display="block">
                                Last message: {formatTimestamp(stats.lastMessage.timestamp)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          {hasMessages && (
                            <Tooltip title={showMessages[topic] ? "Hide messages" : "Show messages"}>
                              <IconButton
                                size="small"
                                onClick={() => toggleMessageVisibility(topic)}
                              >
                                {showMessages[topic] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Unsubscribe">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveSubscription(topic)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {showMessages[topic] && hasMessages && (
                      <ListItem>
                        <Box sx={{ width: '100%', pl: 2 }}>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="caption">
                                Latest Message
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box sx={{ 
                                backgroundColor: 'grey.50', 
                                p: 1, 
                                borderRadius: 1,
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                maxHeight: '200px'
                              }}>
                                <pre>
                                  {JSON.stringify(messages[topic].message, null, 2)}
                                </pre>
                              </Box>
                              <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                Received: {formatTimestamp(messages[topic].timestamp)}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      </ListItem>
                    )}
                    
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </CardContent>

      {/* Add Subscription Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add MQTT Subscription</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Topic"
            fullWidth
            variant="outlined"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g., ai/chatbot/response/123"
            helperText="Use + for single-level wildcard, # for multi-level wildcard"
          />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Quick Templates
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {topicTemplates.map((template, index) => (
              <Tooltip key={index} title={template.description}>
                <Chip
                  label={template.name}
                  onClick={() => handleTemplateSelect(template)}
                  size="small"
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddSubscription}
            disabled={!newTopic.trim() || !isConnected}
            variant="contained"
          >
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default MqttSubscriptionManager;