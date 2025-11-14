import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Context and utils
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import theme from '../../themes/theme';
import { FEATURES } from '../../utils/version';

// API service for AI image analysis
import { analyzeImage } from '../../services/aiService';

const ImageAnalysisScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const cameraRef = useRef(null);

  // Request camera and media library permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          t('permissions.title'),
          t('permissions.cameraAccess'),
          [{ text: t('common.ok') }]
        );
      }
    };
    
    requestPermissions();
  }, []);

  // Function to take a photo with camera
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      
      // Save to media library
      if (Platform.OS !== 'web') {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
      
      setImage(photo.uri);
      setCameraMode(false);
      
      // Auto analyze the image
      analyzePhotoWithAI(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('errors.cameraError'), t('errors.tryAgain'));
    }
  };

  // Function to pick an image from the gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.cancelled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        analyzePhotoWithAI(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('errors.galleryError'), t('errors.tryAgain'));
    }
  };

  // Function to send the image to AI for analysis
  const analyzePhotoWithAI = async (imageUri) => {
    if (!FEATURES.AI_PLANT_IDENTIFICATION) {
      Alert.alert(
        t('premium.featureUnavailable'),
        t('premium.upgradeMessage'),
        [
          { text: t('common.notNow') },
          { text: t('premium.upgrade'), onPress: () => navigation.navigate('Upgrade') }
        ]
      );
      return;
    }
    
    setAnalyzing(true);
    setAnalysisResults(null);
    
    try {
      const results = await analyzeImage(imageUri);
      setAnalysisResults(results);
      
      if (results) {
        // Navigate to results screen
        navigation.navigate('PlantAnalysis', {
          imageUri,
          results
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        t('errors.analysisError'),
        t('errors.tryAgain'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Function to toggle between front and back camera
  const flipCamera = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  // Check if we have permission
  if (hasPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
        <Text style={styles.permissionText}>{t('permissions.checking')}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="camera-off" size={64} color={theme.COLORS.error.main} />
        <Text style={styles.permissionText}>{t('permissions.denied')}</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (cameraMode) setCameraMode(false);
            else navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {cameraMode 
            ? t('imageAnalysis.takePhoto') 
            : t('imageAnalysis.identifyPlant')
          }
        </Text>
        {cameraMode && (
          <TouchableOpacity style={styles.flipButton} onPress={flipCamera}>
            <Ionicons name="camera-reverse" size={24} color={theme.COLORS.text.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Main Content */}
      {cameraMode ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            ratio="4:3"
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image Preview */}
          <View style={styles.imageContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="leaf-outline" size={80} color={theme.COLORS.primary.light} />
                <Text style={styles.placeholderText}>
                  {t('imageAnalysis.noImageSelected')}
                </Text>
              </View>
            )}
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.galleryButton]}
              onPress={pickImage}
              disabled={analyzing}
            >
              <Ionicons name="images" size={24} color={theme.COLORS.white} />
              <Text style={styles.actionButtonText}>{t('imageAnalysis.selectFromGallery')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cameraButton]}
              onPress={() => setCameraMode(true)}
              disabled={analyzing}
            >
              <Ionicons name="camera" size={24} color={theme.COLORS.white} />
              <Text style={styles.actionButtonText}>{t('imageAnalysis.takePhoto')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Analysis Button - only show if image is selected */}
          {image && !analyzing && !analysisResults && (
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={() => analyzePhotoWithAI(image)}
            >
              <Ionicons name="search" size={24} color={theme.COLORS.white} />
              <Text style={styles.analyzeButtonText}>
                {t('imageAnalysis.identifyPlant')}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Loading indicator during analysis */}
          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
              <Text style={styles.loadingText}>{t('imageAnalysis.analyzing')}</Text>
            </View>
          )}
          
          {/* Info text at the bottom */}
          <Text style={styles.infoText}>
            {t('imageAnalysis.infoText')}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background,
    padding: 20,
  },
  permissionText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: theme.COLORS.text.primary,
  },
  permissionButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    color: theme.COLORS.text.primary,
  },
  flipButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.COLORS.neutral.grey100,
    marginVertical: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.neutral.grey100,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  galleryButton: {
    backgroundColor: theme.COLORS.secondary.main,
  },
  cameraButton: {
    backgroundColor: theme.COLORS.primary.main,
  },
  actionButtonText: {
    color: theme.COLORS.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: theme.COLORS.success.main,
    borderRadius: 8,
    marginVertical: 12,
  },
  analyzeButtonText: {
    color: theme.COLORS.white,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.COLORS.text.primary,
  },
  infoText: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 24,
  },
  captureButton: {
    alignSelf: 'center',
    marginBottom: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});

export default ImageAnalysisScreen;