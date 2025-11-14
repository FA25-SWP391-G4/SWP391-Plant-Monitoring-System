import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

const PlantAnalysisScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { imageUri, results } = route.params || {
    imageUri: null,
    results: {
      identifiedPlant: {
        name: 'Unknown Plant',
        scientificName: 'Species unknown',
        confidence: 0,
      },
      description: 'No plant information available.',
    },
  };

  // Format confidence percentage
  const confidencePercent = results?.identifiedPlant?.confidence 
    ? `${Math.round(results.identifiedPlant.confidence)}%`
    : 'N/A';

  // Determine status color based on confidence
  const getConfidenceColor = () => {
    const confidence = results?.identifiedPlant?.confidence || 0;
    if (confidence >= 90) return theme.COLORS.success.main;
    if (confidence >= 70) return theme.COLORS.warning.main;
    return theme.COLORS.error.main;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('plantAnalysis.results')}</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            // Share functionality would be implemented here
            // For now, just show a message
            alert(t('common.comingSoon'));
          }}
        >
          <Ionicons name="share-outline" size={24} color={theme.COLORS.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plant Image */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.plantImage} />
          ) : (
            /* Image placeholder - will be replaced with actual images later */
            <View style={[styles.plantImage, { backgroundColor: theme.COLORS.primary.main, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="leaf" size={60} color="white" />
              <Text style={{ color: 'white', marginTop: 10, fontWeight: 'bold' }}>Plant Image</Text>
            </View>
          )}
          <View style={styles.healthBadge}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: getConfidenceColor() }
            ]} />
            <Text style={styles.healthBadgeText}>
              {confidencePercent} {t('plantAnalysis.match')}
            </Text>
          </View>
        </View>

        {/* Plant Info */}
        <View style={styles.infoSection}>
          <Text style={styles.plantName}>{results.identifiedPlant.name}</Text>
          <Text style={styles.scientificName}>{results.identifiedPlant.scientificName}</Text>
          
          {results.identifiedPlant.commonNames && results.identifiedPlant.commonNames.length > 0 && (
            <View style={styles.commonNamesContainer}>
              <Text style={styles.sectionTitle}>{t('plantAnalysis.alsoKnownAs')}:</Text>
              <Text style={styles.commonNames}>
                {results.identifiedPlant.commonNames.join(', ')}
              </Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>{t('plantAnalysis.aboutPlant')}</Text>
          <Text style={styles.description}>{results.description}</Text>
        </View>

        {/* Care Tips */}
        <View style={styles.careSection}>
          <Text style={styles.sectionTitle}>{t('plantAnalysis.careTips')}</Text>
          
          <View style={styles.careTipItem}>
            <View style={styles.careTipIcon}>
              <Ionicons name="water" size={24} color={theme.COLORS.info.main} />
            </View>
            <View style={styles.careTipContent}>
              <Text style={styles.careTipTitle}>{t('plantAnalysis.watering')}</Text>
              <Text style={styles.careTipText}>
                {results.careTips?.watering || t('plantAnalysis.noTipsAvailable')}
              </Text>
            </View>
          </View>
          
          <View style={styles.careTipItem}>
            <View style={styles.careTipIcon}>
              <Ionicons name="sunny" size={24} color={theme.COLORS.warning.main} />
            </View>
            <View style={styles.careTipContent}>
              <Text style={styles.careTipTitle}>{t('plantAnalysis.light')}</Text>
              <Text style={styles.careTipText}>
                {results.careTips?.light || t('plantAnalysis.noTipsAvailable')}
              </Text>
            </View>
          </View>
          
          <View style={styles.careTipItem}>
            <View style={styles.careTipIcon}>
              <Ionicons name="thermometer" size={24} color={theme.COLORS.error.main} />
            </View>
            <View style={styles.careTipContent}>
              <Text style={styles.careTipTitle}>{t('plantAnalysis.temperature')}</Text>
              <Text style={styles.careTipText}>
                {results.careTips?.temperature || t('plantAnalysis.noTipsAvailable')}
              </Text>
            </View>
          </View>
          
          <View style={styles.careTipItem}>
            <View style={styles.careTipIcon}>
              <Ionicons name="water-outline" size={24} color={theme.COLORS.primary.light} />
            </View>
            <View style={styles.careTipContent}>
              <Text style={styles.careTipTitle}>{t('plantAnalysis.humidity')}</Text>
              <Text style={styles.careTipText}>
                {results.careTips?.humidity || t('plantAnalysis.noTipsAvailable')}
              </Text>
            </View>
          </View>
          
          <View style={styles.careTipItem}>
            <View style={styles.careTipIcon}>
              <Ionicons name="nutrition" size={24} color={theme.COLORS.secondary.main} />
            </View>
            <View style={styles.careTipContent}>
              <Text style={styles.careTipTitle}>{t('plantAnalysis.soil')}</Text>
              <Text style={styles.careTipText}>
                {results.careTips?.soil || t('plantAnalysis.noTipsAvailable')}
              </Text>
            </View>
          </View>
          
          <View style={styles.careTipItem}>
            <View style={styles.careTipIcon}>
              <Ionicons name="flask" size={24} color={theme.COLORS.success.main} />
            </View>
            <View style={styles.careTipContent}>
              <Text style={styles.careTipTitle}>{t('plantAnalysis.fertilizer')}</Text>
              <Text style={styles.careTipText}>
                {results.careTips?.fertilizer || t('plantAnalysis.noTipsAvailable')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to add plant screen with identified plant info
              navigation.navigate('AddPlant', {
                plantInfo: results.identifiedPlant,
                imageUri: imageUri,
              });
            }}
          >
            <Ionicons name="add-circle" size={24} color={theme.COLORS.white} />
            <Text style={styles.actionButtonText}>{t('plantAnalysis.addToMyPlants')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('ImageAnalysis')}
          >
            <Ionicons name="camera" size={24} color={theme.COLORS.white} />
            <Text style={styles.actionButtonText}>{t('plantAnalysis.analyzeAnother')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  healthBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.COLORS.text.secondary,
    marginBottom: 12,
  },
  commonNamesContainer: {
    marginBottom: 16,
  },
  commonNames: {
    fontSize: 14,
    color: theme.COLORS.text.primary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.COLORS.neutral.grey200,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.COLORS.text.primary,
    lineHeight: 22,
  },
  careSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  careTipItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  careTipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.neutral.grey100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  careTipContent: {
    flex: 1,
  },
  careTipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  careTipText: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: theme.COLORS.secondary.main,
  },
  actionButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PlantAnalysisScreen;