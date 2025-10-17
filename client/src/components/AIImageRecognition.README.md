# AIImageRecognition Component

An advanced AI-powered plant disease recognition component that allows users to upload plant images for disease detection and treatment recommendations.

## Features

### ✅ Implemented (Task 4.3 Requirements)

- **Image upload and preview**: Drag-and-drop interface with file selection and image preview
- **Real-time analysis progress**: Progress bar and status indicators during AI processing
- **Results display**: Comprehensive disease detection results with confidence scores
- **Treatment recommendations**: AI-generated treatment suggestions for detected diseases
- **Analysis history**: Local storage of recent analyses with thumbnails and results

### Additional Features

- **Multi-language support**: Uses react-i18next for internationalization
- **File validation**: Validates image file types and size limits (max 10MB)
- **Drag and drop support**: Intuitive drag-and-drop interface for image upload
- **Plant context awareness**: Integrates with plant data when available
- **Confidence indicators**: Color-coded confidence levels for analysis results
- **Severity indicators**: Visual indicators for disease severity levels
- **Prevention tips**: AI-generated prevention recommendations
- **Responsive design**: Works on desktop and mobile devices
- **Error handling**: Comprehensive error handling with user-friendly messages

## Usage

### Basic Usage (Standalone Disease Recognition)

```jsx
import AIImageRecognition from '@/components/AIImageRecognition';

function PlantCarePage() {
  return (
    <div>
      <AIImageRecognition />
    </div>
  );
}
```

### With Plant Context

```jsx
import AIImageRecognition from '@/components/AIImageRecognition';

function PlantDetailPage({ plant }) {
  return (
    <div>
      <AIImageRecognition 
        plant={plant}
        className="max-w-4xl"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `plant` | `Object` | `null` | Plant data object for context-aware analysis |
| `className` | `string` | `''` | Additional CSS classes for styling |

### Plant Object Structure

```javascript
{
  id: number,                    // Plant ID for analysis history
  name: string,                  // Plant name
  species: string,               // Plant species for improved accuracy
}
```

## API Integration

The component integrates with the AI service through `aiApi.analyzeImage()`:

```javascript
const formData = new FormData();
formData.append('image', selectedFile);
if (plant) {
  formData.append('plant_id', plant.id);
  formData.append('plant_type', plant.species || plant.name);
}

const response = await aiApi.analyzeImage(formData);
```

## Analysis Results Structure

```javascript
{
  disease_detected: string,           // Detected disease name
  confidence: number,                 // Confidence score (0-1)
  severity: string,                   // Disease severity level
  treatment_suggestions: string[],    // Array of treatment recommendations
  prevention_tips: string[],          // Array of prevention tips
  condition: string                   // Overall plant condition
}
```

## Analysis History

The component automatically saves analysis history to localStorage:

```javascript
{
  id: number,                    // Unique analysis ID
  timestamp: string,             // ISO date string
  plantName: string,             // Plant name
  plantId: number,               // Plant ID (if available)
  fileName: string,              // Original file name
  result: object,                // Analysis result object
  preview: string                // Base64 image preview
}
```

## File Validation

- **Supported formats**: JPG, PNG, WebP, and other image formats
- **Maximum file size**: 10MB
- **File type validation**: Ensures only image files are accepted
- **Error handling**: User-friendly error messages for invalid files

## Progress Indicators

The component shows real-time analysis progress:

1. **Upload Progress**: File selection and preview generation
2. **Analysis Progress**: Animated progress bar (0-100%)
3. **Processing Status**: Text indicators for current processing stage
4. **Completion**: Results display with confidence indicators

## Styling

The component uses Tailwind CSS classes and custom UI components:

- `Card`, `CardHeader`, `CardTitle`, `CardContent` for layout
- `Button` for interactive elements
- `Input` for file selection
- Responsive design with mobile-first approach
- Color-coded confidence and severity indicators

## Internationalization

Supports multiple languages through react-i18next:

- English (`en/imageRecognition.json`)
- Vietnamese (`vi/imageRecognition.json`)
- Extensible to other languages

### Translation Keys

```json
{
  "imageRecognition": {
    "title": "Plant Disease Recognition",
    "subtitle": "Upload plant images to detect diseases and get treatment recommendations",
    "subtitleWithPlant": "Analyze {{plantName}} for diseases and health issues",
    "uploadTitle": "Upload Plant Image",
    "uploadDescription": "Drag and drop an image here, or click to select",
    "selectFile": "Select Image",
    "fileRequirements": "Supports JPG, PNG, WebP (max 10MB)",
    "analyzing": "Analyzing image...",
    "processingImage": "Processing image with AI model...",
    "analyzeButton": "Analyze Plant Health",
    "analysisResults": "Analysis Results",
    "diseaseDetection": "Disease Detection",
    "detectedCondition": "Detected Condition:",
    "severity": "Severity:",
    "confidence": "confidence",
    "treatmentRecommendations": "Treatment Recommendations",
    "preventionTips": "Prevention Tips",
    "analysisHistory": "Recent Analysis History",
    "healthy": "Healthy",
    "clear": "Clear",
    "viewAllHistory": "View All History",
    "invalidFileType": "Please select a valid image file",
    "fileTooLarge": "File size must be less than 10MB",
    "noFileSelected": "Please select an image to analyze",
    "analysisError": "Unable to analyze image. Please try again."
  }
}
```

## Confidence and Severity Indicators

### Confidence Colors
- **Green (80%+)**: High confidence - reliable results
- **Yellow (60-79%)**: Medium confidence - generally reliable
- **Red (<60%)**: Low confidence - results may be uncertain

### Severity Colors
- **Green**: Low/Mild severity
- **Yellow**: Moderate severity
- **Red**: High/Severe severity

## Integration Example

The component can be integrated into plant detail pages:

```jsx
// In plant-detail/[id]/page.jsx
{activeTab === 'disease-recognition' && (
  <div className="max-w-4xl">
    <AIImageRecognition 
      plant={plant} 
      className="w-full"
    />
  </div>
)}
```

## Testing

The component includes comprehensive tests covering:

- Basic rendering and interface elements
- File upload and validation
- Drag and drop functionality
- Analysis progress and results display
- Error handling scenarios
- Plant context integration
- Analysis history management
- Confidence and severity indicators

Run tests with:
```bash
npm test AIImageRecognition.test.js
```

## Requirements Compliance

This implementation fully satisfies the task requirements:

1. ✅ **Build AIImageRecognition.jsx with image upload and preview**
   - Drag-and-drop interface with file selection
   - Real-time image preview with validation
   - Support for multiple image formats

2. ✅ **Add real-time analysis progress and results display**
   - Animated progress bar during analysis
   - Real-time status updates
   - Comprehensive results display with confidence scores

3. ✅ **Implement treatment recommendations and analysis history**
   - AI-generated treatment suggestions
   - Prevention tips and care recommendations
   - Local storage of analysis history with thumbnails
   - Historical analysis browsing

4. ✅ **Requirements 3.1, 3.2 compliance**
   - Integrates with TensorFlow.js disease recognition model
   - Provides plant disease detection with confidence scores
   - Stores analysis results in database through API
   - Supports image preprocessing and analysis pipeline

## Performance Considerations

- **Image Optimization**: Automatic image preview generation
- **Progress Simulation**: Smooth progress indicators during analysis
- **Memory Management**: Efficient handling of image data
- **Caching**: Analysis history stored locally for quick access
- **Error Recovery**: Graceful handling of API failures

## Security Features

- **File Validation**: Strict image file type and size validation
- **Input Sanitization**: Safe handling of user-uploaded files
- **Error Handling**: Secure error messages without exposing system details
- **Data Privacy**: Local storage of analysis history with user control