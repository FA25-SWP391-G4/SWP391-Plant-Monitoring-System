# AIWateringPrediction Component

A React component that provides AI-powered watering predictions for plants using machine learning models and sensor data analysis.

## Features

- **7-Day Prediction Timeline**: Shows watering recommendations for the next 7 days
- **Confidence Indicators**: Displays prediction confidence levels with color-coded indicators
- **Manual Override Options**: Allows users to override AI recommendations manually
- **Sensor Data Visualization**: Shows current plant conditions (moisture, temperature, humidity, light)
- **Real-time Updates**: Auto-refreshes predictions every 30 minutes
- **Fallback Mode**: Provides basic rule-based predictions when AI service is unavailable
- **Internationalization**: Full i18n support with react-i18next

## Usage

### Basic Usage

```jsx
import AIWateringPrediction from '@/components/AIWateringPrediction';

function PlantDetailPage() {
  const plant = {
    id: 1,
    name: 'Snake Plant',
    species: 'Sansevieria trifasciata',
    current_moisture: 45,
    current_temperature: 22,
    current_humidity: 60,
    current_light: 800,
    last_watered: '2024-10-15T10:00:00Z',
    location: 'Living Room'
  };

  return (
    <div>
      <AIWateringPrediction plant={plant} />
    </div>
  );
}
```

### With Custom Styling

```jsx
<AIWateringPrediction 
  plant={plant} 
  className="max-w-4xl mx-auto shadow-lg" 
/>
```

### Without Plant (Shows Selection Message)

```jsx
<AIWateringPrediction />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `plant` | `Object` | `null` | Plant object with sensor data and metadata |
| `className` | `string` | `''` | Additional CSS classes for styling |

### Plant Object Structure

```javascript
{
  id: number,                    // Plant ID
  name: string,                  // Plant name
  species: string,               // Plant species
  current_moisture: number,      // Current moisture level (0-100%)
  current_temperature: number,   // Current temperature (°C)
  current_humidity: number,      // Current humidity (0-100%)
  current_light: number,         // Current light level (lux)
  last_watered: string,         // ISO date string of last watering
  location: string              // Plant location
}
```

## API Integration

The component integrates with the AI service through the `aiApi.predictWatering()` method:

```javascript
// API call structure
const response = await aiApi.predictWatering({
  plant_id: plant.id,
  sensor_data: {
    moisture: plant.current_moisture,
    temperature: plant.current_temperature,
    humidity: plant.current_humidity,
    light: plant.current_light,
    plant_type: plant.species,
    last_watered: plant.last_watered,
    location: plant.location
  },
  prediction_days: 7
});
```

## Features in Detail

### Prediction Timeline

- Shows 7-day watering recommendations
- Each day displays:
  - Date (Today, Tomorrow, or formatted date)
  - Watering recommendation (Water/Skip)
  - Confidence level (0-100%)
  - Recommended water amount (ml)
  - Reasoning for the recommendation
  - Predicted moisture and temperature

### Confidence Indicators

- **Green (80%+)**: High confidence predictions
- **Yellow (60-79%)**: Medium confidence predictions  
- **Red (<60%)**: Low confidence predictions

### Manual Override

- Users can override any day's recommendation
- Override is clearly marked with purple styling
- Can be cleared to restore AI prediction
- Triggers prediction refresh when cleared

### Error Handling

- Graceful fallback to rule-based predictions
- User-friendly error messages
- Retry mechanisms for API failures
- Loading states with skeleton animations

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- Card-based layout with shadows and borders
- Responsive grid layouts
- Color-coded indicators
- Smooth animations and transitions
- Mobile-friendly responsive design

## Internationalization

All text is internationalized using react-i18next. Key translation keys:

- `wateringPrediction.title`
- `wateringPrediction.subtitle`
- `wateringPrediction.currentConditions`
- `wateringPrediction.timeline`
- `wateringPrediction.confidence`
- And many more...

## Testing

The component includes comprehensive Jest tests covering:

- Rendering with and without plant data
- API integration and error handling
- Manual override functionality
- Confidence indicator display
- Loading states
- Internationalization

Run tests with:
```bash
npm test -- --testPathPattern=AIWateringPrediction.test.js
```

## Dependencies

- React 18+
- react-i18next for internationalization
- Custom UI components (Card, Button)
- aiApi for backend integration
- Tailwind CSS for styling

## Integration Examples

### In Plant Detail Page

```jsx
// Add to plant detail tabs
{activeTab === 'ai-predictions' && (
  <div className="max-w-4xl">
    <AIWateringPrediction 
      plant={plant} 
      className="w-full"
    />
  </div>
)}
```

### In Dashboard Widget

```jsx
// As a dashboard widget
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <AIWateringPrediction 
    plant={selectedPlant} 
    className="h-96"
  />
  <OtherWidget />
</div>
```

## Performance Considerations

- Auto-refresh every 30 minutes (configurable)
- Caches predictions to reduce API calls
- Efficient re-rendering with React hooks
- Lazy loading of prediction data
- Optimized for mobile devices

## Future Enhancements

- Weather integration for better predictions
- Historical accuracy tracking
- Custom prediction intervals
- Export predictions to calendar
- Push notifications for watering reminders