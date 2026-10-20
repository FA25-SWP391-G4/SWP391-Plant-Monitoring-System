import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('legal.privacyPolicy')}</Text>
        
        <Text style={styles.paragraph}>
          {t('legal.privacyIntro')}
        </Text>
        
        <Text style={styles.sectionTitle}>1. {t('legal.privacySection1')}</Text>
        <Text style={styles.paragraph}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisi vel
          consectetur euismod, nisi nisi consectetur nisi, euismod nisi vel consectetur euismod.
        </Text>
        
        <Text style={styles.sectionTitle}>2. {t('legal.privacySection2')}</Text>
        <Text style={styles.paragraph}>
          Etiam in quam eu felis lobortis fermentum. Suspendisse potenti. Donec euismod, nisi vel
          consectetur euismod, nisi nisi consectetur nisi, euismod nisi vel consectetur euismod.
        </Text>
        
        <Text style={styles.sectionTitle}>3. {t('legal.privacySection3')}</Text>
        <Text style={styles.paragraph}>
          Praesent vel metus vel risus hendrerit tincidunt. Nullam euismod, nisi vel
          consectetur euismod, nisi nisi consectetur nisi, euismod nisi vel consectetur euismod.
        </Text>
        
        <Text style={styles.sectionTitle}>4. {t('legal.privacySection4')}</Text>
        <Text style={styles.paragraph}>
          Fusce auctor, nibh nec ultricies lacinia, nisl nunc aliquam urna, eu egestas nunc
          mauris nec metus. Nullam euismod, nisi vel consectetur euismod, nisi nisi consectetur
          nisi, euismod nisi vel consectetur euismod.
        </Text>
        
        <Text style={styles.sectionTitle}>5. {t('legal.privacySection5')}</Text>
        <Text style={styles.paragraph}>
          Aliquam erat volutpat. Nullam euismod, nisi vel consectetur euismod, nisi nisi consectetur
          nisi, euismod nisi vel consectetur euismod.
        </Text>
        
        <Text style={styles.sectionTitle}>{t('legal.contact')}</Text>
        <Text style={styles.paragraph}>
          {t('legal.contactInfo')}
        </Text>
        
        <Text style={styles.updatedDate}>
          {t('legal.lastUpdated')}: 2023-04-15
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: theme.COLORS.text.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    color: theme.COLORS.text.primary,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.COLORS.text.secondary,
    marginBottom: 16,
  },
  updatedDate: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default PrivacyPolicyScreen;