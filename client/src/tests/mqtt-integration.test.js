import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MqttProvider, useMqttContext } from '../contexts/MqttContext';
import MqttConnectionStatus from '../components/MqttConnectionStatus';
import MqttSubscriptionManager from '../components/MqttSubscriptionManager';
import MqttIntegrationDemo from '../components/MqttIntegrationDemo';

// Mock MQTT library
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn((topic, options, callback) => {
      if (callback) callback(null);
    }),
    unsubscribe: jest.fn((topic, callback) => {
      if (callback) callback(null);
    }),
    publish: jest.fn((topic, message, options, callback) => {
      if (callback) callback(null);
    }),
    end: jest.fn(),
    connected: true,
    options: { clientId: 'test-client' }
  }))
}));

// Test component to access MQTT context
const TestComponent = () => {
  const mqtt = useMqttContext();
  return (
    <div>
      <div data-testid="connection-status">{mqtt.connectionStatus}</div>
      <div data-testid="is-connected">{mqtt.isConnected.toString()}</div>
      <div data-testid="subscriptions-count">{mqtt.subscriptions.size}</div>
      <button 
        data-testid="connect-btn" 
        onClick={mqtt.connect}
      >
        Connect
      </button>
      <button 
        data-testid="disconnect-btn" 
        onClick={mqtt.disconnect}
      >
        Disconnect
      </button>
    </div>
  );
};

describe('MQTT Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MqttProvider', () => {
    test('provides MQTT context to children', () => {
      render(
        <MqttProvider>
          <TestComponent />
        </MqttProvider>
      );

      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      expect(screen.getByTestId('is-connected')).toBeInTheDocument();
      expect(screen.getByTestId('subscriptions-count')).toBeInTheDocument();
    });

    test('initializes with default values', () => {
      render(
        <MqttProvider>
          <TestComponent />
        </MqttProvider>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
      expect(screen.getByTestId('subscriptions-count')).toHaveTextContent('0');
    });

    test('provides AI topic helpers', async () => {
      const TestAITopics = () => {
        const { aiTopics } = useMqttContext();
        return (
          <div>
            <button 
              data-testid="chatbot-subscribe"
              onClick={() => aiTopics.chatbot.subscribe('123')}
            >
              Subscribe Chatbot
            </button>
            <button 
              data-testid="disease-subscribe"
              onClick={() => aiTopics.disease.subscribe('456')}
            >
              Subscribe Disease
            </button>
            <button 
              data-testid="irrigation-subscribe"
              onClick={() => aiTopics.irrigation.subscribe('789')}
            >
              Subscribe Irrigation
            </button>
          </div>
        );
      };

      render(
        <MqttProvider>
          <TestAITopics />
        </MqttProvider>
      );

      expect(screen.getByTestId('chatbot-subscribe')).toBeInTheDocument();
      expect(screen.getByTestId('disease-subscribe')).toBeInTheDocument();
      expect(screen.getByTestId('irrigation-subscribe')).toBeInTheDocument();
    });
  });

  describe('MqttConnectionStatus', () => {
    test('renders connection status chip', () => {
      render(
        <MqttProvider>
          <MqttConnectionStatus variant="chip" />
        </MqttProvider>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('renders connection status icon', () => {
      render(
        <MqttProvider>
          <MqttConnectionStatus variant="icon" />
        </MqttProvider>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('renders detailed connection status', () => {
      render(
        <MqttProvider>
          <MqttConnectionStatus variant="detailed" />
        </MqttProvider>
      );

      expect(screen.getByText('MQTT Status')).toBeInTheDocument();
    });

    test('shows connection details on click', async () => {
      render(
        <MqttProvider>
          <MqttConnectionStatus variant="chip" showDetails={true} />
        </MqttProvider>
      );

      const statusChip = screen.getByRole('button');
      fireEvent.click(statusChip);

      await waitFor(() => {
        expect(screen.getByText('MQTT Connection Details')).toBeInTheDocument();
      });
    });
  });

  describe('MqttSubscriptionManager', () => {
    test('renders subscription manager', () => {
      render(
        <MqttProvider>
          <MqttSubscriptionManager />
        </MqttProvider>
      );

      expect(screen.getByText('MQTT Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('0 active subscriptions')).toBeInTheDocument();
    });

    test('shows add subscription dialog', async () => {
      render(
        <MqttProvider>
          <MqttSubscriptionManager showAddSubscription={true} />
        </MqttProvider>
      );

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add MQTT Subscription')).toBeInTheDocument();
      });
    });

    test('displays topic templates', async () => {
      render(
        <MqttProvider>
          <MqttSubscriptionManager showAddSubscription={true} />
        </MqttProvider>
      );

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Quick Templates')).toBeInTheDocument();
        expect(screen.getByText('Chatbot Response')).toBeInTheDocument();
        expect(screen.getByText('Disease Analysis')).toBeInTheDocument();
        expect(screen.getByText('Irrigation Prediction')).toBeInTheDocument();
      });
    });
  });

  describe('MqttIntegrationDemo', () => {
    test('renders demo interface', () => {
      render(
        <MqttProvider>
          <MqttIntegrationDemo />
        </MqttProvider>
      );

      expect(screen.getByText('MQTT Integration Demo')).toBeInTheDocument();
      expect(screen.getByText('AI Testing')).toBeInTheDocument();
      expect(screen.getByText('Message Monitor')).toBeInTheDocument();
      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    });

    test('shows demo controls', () => {
      render(
        <MqttProvider>
          <MqttIntegrationDemo />
        </MqttProvider>
      );

      expect(screen.getByText('Start Demo')).toBeInTheDocument();
      expect(screen.getByText('Clear Messages')).toBeInTheDocument();
      expect(screen.getByLabelText('Test User ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Plant ID')).toBeInTheDocument();
    });

    test('enables demo mode', async () => {
      render(
        <MqttProvider>
          <MqttIntegrationDemo />
        </MqttProvider>
      );

      const startButton = screen.getByText('Start Demo');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Demo')).toBeInTheDocument();
      });
    });

    test('shows AI testing controls when demo is active', async () => {
      render(
        <MqttProvider>
          <MqttIntegrationDemo />
        </MqttProvider>
      );

      const startButton = screen.getByText('Start Demo');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('AI Chatbot Testing')).toBeInTheDocument();
        expect(screen.getByText('Disease Detection')).toBeInTheDocument();
        expect(screen.getByText('Irrigation Prediction')).toBeInTheDocument();
      });
    });
  });

  describe('AI Topic Helpers', () => {
    test('chatbot helpers work correctly', async () => {
      const TestChatbotHelpers = () => {
        const { aiTopics } = useMqttContext();
        const [subscribed, setSubscribed] = React.useState(false);
        const [published, setPublished] = React.useState(false);

        const handleSubscribe = async () => {
          await aiTopics.chatbot.subscribe('123', () => {});
          setSubscribed(true);
        };

        const handlePublish = async () => {
          await aiTopics.chatbot.publish('123', { message: 'test' });
          setPublished(true);
        };

        return (
          <div>
            <button data-testid="subscribe" onClick={handleSubscribe}>
              Subscribe
            </button>
            <button data-testid="publish" onClick={handlePublish}>
              Publish
            </button>
            <div data-testid="subscribed">{subscribed.toString()}</div>
            <div data-testid="published">{published.toString()}</div>
          </div>
        );
      };

      render(
        <MqttProvider>
          <TestChatbotHelpers />
        </MqttProvider>
      );

      const subscribeBtn = screen.getByTestId('subscribe');
      const publishBtn = screen.getByTestId('publish');

      fireEvent.click(subscribeBtn);
      await waitFor(() => {
        expect(screen.getByTestId('subscribed')).toHaveTextContent('true');
      });

      fireEvent.click(publishBtn);
      await waitFor(() => {
        expect(screen.getByTestId('published')).toHaveTextContent('true');
      });
    });

    test('disease detection helpers work correctly', async () => {
      const TestDiseaseHelpers = () => {
        const { aiTopics } = useMqttContext();
        const [subscribed, setSubscribed] = React.useState(false);

        const handleSubscribe = async () => {
          await aiTopics.disease.subscribe('456', () => {});
          setSubscribed(true);
        };

        return (
          <div>
            <button data-testid="subscribe-disease" onClick={handleSubscribe}>
              Subscribe Disease
            </button>
            <div data-testid="disease-subscribed">{subscribed.toString()}</div>
          </div>
        );
      };

      render(
        <MqttProvider>
          <TestDiseaseHelpers />
        </MqttProvider>
      );

      const subscribeBtn = screen.getByTestId('subscribe-disease');
      fireEvent.click(subscribeBtn);

      await waitFor(() => {
        expect(screen.getByTestId('disease-subscribed')).toHaveTextContent('true');
      });
    });

    test('irrigation helpers work correctly', async () => {
      const TestIrrigationHelpers = () => {
        const { aiTopics } = useMqttContext();
        const [subscribed, setSubscribed] = React.useState(false);

        const handleSubscribe = async () => {
          await aiTopics.irrigation.subscribe('789', () => {});
          setSubscribed(true);
        };

        return (
          <div>
            <button data-testid="subscribe-irrigation" onClick={handleSubscribe}>
              Subscribe Irrigation
            </button>
            <div data-testid="irrigation-subscribed">{subscribed.toString()}</div>
          </div>
        );
      };

      render(
        <MqttProvider>
          <TestIrrigationHelpers />
        </MqttProvider>
      );

      const subscribeBtn = screen.getByTestId('subscribe-irrigation');
      fireEvent.click(subscribeBtn);

      await waitFor(() => {
        expect(screen.getByTestId('irrigation-subscribed')).toHaveTextContent('true');
      });
    });
  });

  describe('Connection Quality', () => {
    test('calculates connection quality correctly', () => {
      const TestConnectionQuality = () => {
        const { connectionQuality } = useMqttContext();
        return <div data-testid="quality">{connectionQuality}</div>;
      };

      render(
        <MqttProvider>
          <TestConnectionQuality />
        </MqttProvider>
      );

      // Should start with disconnected quality
      expect(screen.getByTestId('quality')).toHaveTextContent('poor');
    });
  });

  describe('Error Handling', () => {
    test('handles MQTT connection errors gracefully', () => {
      const mqtt = require('mqtt');
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Connection failed'));
          }
        }),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        publish: jest.fn(),
        end: jest.fn(),
        connected: false
      };
      
      mqtt.connect.mockReturnValue(mockClient);

      render(
        <MqttProvider>
          <TestComponent />
        </MqttProvider>
      );

      // Should handle error gracefully without crashing
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });
  });
});

describe('MQTT Hook Integration', () => {
  test('provides enhanced features', () => {
    const TestEnhancedFeatures = () => {
      const mqtt = useMqttContext();
      return (
        <div>
          <div data-testid="connection-quality">{mqtt.connectionQuality}</div>
          <div data-testid="ai-topics-available">{!!mqtt.aiTopics}</div>
          <div data-testid="message-stats">{JSON.stringify(mqtt.messageStats)}</div>
        </div>
      );
    };

    render(
      <MqttProvider>
        <TestEnhancedFeatures />
      </MqttProvider>
    );

    expect(screen.getByTestId('connection-quality')).toBeInTheDocument();
    expect(screen.getByTestId('ai-topics-available')).toHaveTextContent('true');
    expect(screen.getByTestId('message-stats')).toBeInTheDocument();
  });
});