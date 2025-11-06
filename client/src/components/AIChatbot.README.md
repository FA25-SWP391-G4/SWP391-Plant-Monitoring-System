# AIChatbot Component

An enhanced AI-powered chatbot component for plant care assistance with real-time messaging, conversation persistence, and plant context awareness.

## Features

### ✅ Implemented (Task 2.3 Requirements)

- **Real-time messaging interface**: Interactive chat with immediate message display
- **Conversation history display and message persistence**: Messages are saved to localStorage and restored on component mount
- **Typing indicators**: Animated typing indicator during AI response generation
- **Plant context awareness**: Integrates current plant data (moisture, temperature, etc.) into AI conversations

### Additional Features

- **Multi-language support**: Uses react-i18next for internationalization
- **Error handling**: Graceful error handling with user-friendly messages
- **Responsive design**: Works on desktop and mobile devices
- **Conversation management**: Clear conversation functionality
- **Plant-specific conversations**: Separate conversation history per plant
- **Confidence indicators**: Shows AI response confidence when available
- **Suggestions**: Displays AI-generated suggestions for follow-up questions

## Usage

### Basic Usage (General Plant Care)

```jsx
import AIChatbot from '@/components/ai/AIChatbot';

function PlantCarePage() {
  return (
    <div>
      <AIChatbot />
    </div>
  );
}
```

### With Plant Context

```jsx
import AIChatbot from '@/components/ai/AIChatbot';

function PlantDetailPage({ plant }) {
  return (
    <div>
      <AIChatbot 
        plant={plant}
        className="h-[500px]"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `plant` | `Object` | `null` | Plant data object for context-aware conversations |
| `className` | `string` | `''` | Additional CSS classes for styling |

### Plant Object Structure

```javascript
{
  id: number,                    // Plant ID for conversation persistence
  name: string,                  // Plant name
  species: string,               // Plant species
  current_moisture: number,      // Current soil moisture (%)
  current_temperature: number,   // Current temperature (°C)
  current_humidity: number,      // Current humidity (%)
  current_light: number,         // Current light level (lux)
  last_watered: string,          // ISO date string of last watering
  location: string,              // Plant location
  care_info: string             // Additional care information
}
```

## API Integration

The component integrates with the AI service through `aiApi.chatWithAI()`:

```javascript
const response = await aiApi.chatWithAI({
  message: userMessage,
  plant_id: plant?.id,
  conversation_id: conversationId,
  context: plantContext,
  conversation_history: recentMessages
});
```

## Conversation Persistence

Conversations are automatically saved to localStorage with the key `ai_chat_history`:

```javascript
{
  [plantId]: {
    conversationId: string,
    messages: Array,
    lastUpdated: string,
    plantName: string
  }
}
```

## Styling

The component uses Tailwind CSS classes and custom UI components:

- `Card`, `CardHeader`, `CardTitle`, `CardContent` for layout
- `Button` for interactive elements
- `Input` for message input
- Responsive design with mobile-first approach

## Internationalization

Supports multiple languages through react-i18next:

- English (`en/ai.json`)
- Vietnamese (`vi/ai.json`)
- Extensible to other languages

### Translation Keys

```json
{
  "chatbot": {
    "title": "AI Plant Care Assistant",
    "welcome": "Hello! I'm your AI plant care assistant...",
    "welcomeWithPlant": "Hello! I can help with {{plantName}}...",
    "placeholder": "Ask me about plant care...",
    "error": "I'm having trouble connecting...",
    "suggestions": "Suggestions:",
    "contextActive": "Plant context active: {{plantName}}"
  }
}
```

## Integration Example

The component is integrated into the plant detail page as a tab:

```jsx
// In plant-detail/[id]/page.jsx
{activeTab === 'ai-assistant' && (
  <div className="max-w-4xl">
    <AIChatbot 
      plant={plant} 
      className="w-full"
    />
  </div>
)}
```

## Testing

The component includes comprehensive tests covering:

- Basic rendering and welcome messages
- Plant context integration
- Message sending and receiving
- Error handling
- Typing indicators
- Conversation persistence
- localStorage integration

Run tests with:
```bash
npm test AIChatbot.test.js
```

## Requirements Compliance

This implementation fully satisfies the task requirements:

1. ✅ **Create AIChatbot.jsx with real-time messaging interface**
   - Interactive chat interface with immediate message display
   - Real-time message updates and smooth scrolling

2. ✅ **Implement conversation history display and message persistence**
   - Messages displayed in chronological order
   - Automatic saving to localStorage
   - Conversation restoration on component mount

3. ✅ **Add typing indicators and plant context awareness**
   - Animated typing indicator during AI processing
   - Plant data integration for context-aware responses
   - Plant-specific conversation management

4. ✅ **Requirements 1.1, 1.2 compliance**
   - Integrates with OpenRouter API through backend
   - Provides plant-focused AI assistance
   - Maintains conversation context and history