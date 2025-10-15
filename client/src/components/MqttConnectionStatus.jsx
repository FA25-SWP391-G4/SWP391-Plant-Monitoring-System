import React, { useState } from 'react';
import { 
  Box, 
  Chip, 
  IconButton, 
  Popover, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  SignalWifi4Bar as SignalWifi4BarIcon,
  SignalWifi3Bar as SignalWifi3BarIcon,
  SignalWifi2Bar as SignalWifi2BarIcon,
  SignalWifi1Bar as SignalWifi1BarIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useMqttContext } from '../contexts/MqttContext';

/**
 * MQTT Connection Status Indicator Component
 * Shows real-time connection status with detailed information
 */
const MqttConnectionStatus = ({ 
  variant = 'chip', // 'chip', 'icon', 'detailed'
  showDetails = true,
  size = 'medium'
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    isConnected,
    connectionStatus,
    connectionQuality,
    error,
    connectionHistory,
    messageStats,
    subscriptions,
    connect,
    disconnect
  } = useMqttContext();

  const handleClick = (event) => {
    if (showDetails) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReconnect = () => {
    connect();
    handleClose();
  };

  const handleDisconnect = () => {
    disconnect();
    handleClose();
  };

  // Get status color and icon
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'success',
          icon: getQualityIcon(),
          label: 'Connected',
          description: `Connection quality: ${connectionQuality}`
        };
      case 'connecting':
      case 'reconnecting':
        return {
          color: 'warning',
          icon: <RefreshIcon className="animate-spin" />,
          label: connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...',
          description: 'Establishing connection to MQTT broker'
        };
      case 'disconnected':
        return {
          color: 'default',
          icon: <WifiOffIcon />,
          label: 'Disconnected',
          description: 'Not connected to MQTT broker'
        };
      case 'offline':
        return {
          color: 'default',
          icon: <WifiOffIcon />,
          label: 'Offline',
          description: 'Client is offline'
        };
      case 'error':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Error',
          description: error || 'Connection error occurred'
        };
      default:
        return {
          color: 'default',
          icon: <WifiOffIcon />,
          label: 'Unknown',
          description: 'Unknown connection status'
        };
    }
  };

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <SignalWifi4BarIcon />;
      case 'good':
        return <SignalWifi3BarIcon />;
      case 'fair':
        return <SignalWifi2BarIcon />;
      case 'poor':
        return <SignalWifi1BarIcon />;
      default:
        return <WifiIcon />;
    }
  };

  const statusConfig = getStatusConfig();
  const open = Boolean(anchorEl);

  // Render different variants
  const renderChip = () => (
    <Chip
      icon={statusConfig.icon}
      label={statusConfig.label}
      color={statusConfig.color}
      size={size}
      onClick={handleClick}
      sx={{ cursor: showDetails ? 'pointer' : 'default' }}
    />
  );

  const renderIcon = () => (
    <Tooltip title={statusConfig.description}>
      <IconButton
        onClick={handleClick}
        color={statusConfig.color}
        size={size}
      >
        {statusConfig.icon}
      </IconButton>
    </Tooltip>
  );

  const renderDetailed = () => (
    <Card sx={{ minWidth: 200 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {statusConfig.icon}
          <Typography variant="h6">
            MQTT Status
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {statusConfig.description}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={isConnected ? handleDisconnect : handleReconnect}
            startIcon={isConnected ? <WifiOffIcon /> : <RefreshIcon />}
          >
            {isConnected ? 'Disconnect' : 'Reconnect'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderPopoverContent = () => (
    <Box sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        MQTT Connection Details
      </Typography>
      
      {/* Current Status */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        {statusConfig.icon}
        <Typography variant="body1">
          Status: <strong>{statusConfig.label}</strong>
        </Typography>
      </Box>

      {connectionQuality && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          Quality: {connectionQuality}
        </Typography>
      )}

      {error && (
        <Typography variant="body2" color="error" mb={2}>
          Error: {error}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Statistics */}
      <Typography variant="subtitle2" gutterBottom>
        Message Statistics
      </Typography>
      <List dense>
        <ListItem>
          <ListItemText
            primary={`Received: ${messageStats.totalReceived}`}
            secondary={`Sent: ${messageStats.totalSent}`}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary={`Active Subscriptions: ${subscriptions.size}`}
            secondary={messageStats.lastActivity ? 
              `Last Activity: ${new Date(messageStats.lastActivity).toLocaleTimeString()}` : 
              'No recent activity'
            }
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Connection History */}
      <Typography variant="subtitle2" gutterBottom>
        Recent Connection History
      </Typography>
      <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
        {connectionHistory.slice(0, 5).map((entry, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {entry.status === 'connected' && <CheckCircleIcon color="success" />}
              {entry.status === 'error' && <ErrorIcon color="error" />}
              {(entry.status === 'connecting' || entry.status === 'reconnecting') && <RefreshIcon color="warning" />}
              {(entry.status === 'disconnected' || entry.status === 'offline') && <WifiOffIcon />}
            </ListItemIcon>
            <ListItemText
              primary={entry.status}
              secondary={new Date(entry.timestamp).toLocaleTimeString()}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Actions */}
      <Box display="flex" gap={1} justifyContent="flex-end">
        <Button
          size="small"
          variant="outlined"
          onClick={isConnected ? handleDisconnect : handleReconnect}
          startIcon={isConnected ? <WifiOffIcon /> : <RefreshIcon />}
        >
          {isConnected ? 'Disconnect' : 'Reconnect'}
        </Button>
        <Button size="small" onClick={handleClose}>
          Close
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      {variant === 'chip' && renderChip()}
      {variant === 'icon' && renderIcon()}
      {variant === 'detailed' && renderDetailed()}

      {showDetails && (
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {renderPopoverContent()}
        </Popover>
      )}
    </>
  );
};

export default MqttConnectionStatus;