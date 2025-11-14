import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePayment } from '../../context/PaymentContext';
import theme from '../../themes/theme';

const SettingsScreen = ({ navigation }) => {
  const { t, language, setLanguage } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const { hasPremium, subscriptionStatus } = usePayment();

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutTitle'),
      t('settings.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.logout'),
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  // Change language
  const changeLanguage = () => {
    Alert.alert(
      t('settings.language'),
      t('settings.selectLanguage'),
      [
        {
          text: 'English',
          onPress: () => setLanguage('en')
        },
        {
          text: 'Español',
          onPress: () => setLanguage('es')
        },
        {
          text: 'Français',
          onPress: () => setLanguage('fr')
        },
        {
          text: '中文',
          onPress: () => setLanguage('zh')
        },
        {
          text: t('common.cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="person-circle-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.profile')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.notifications')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('Subscription')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="star-outline" size={24} color={theme.COLORS.text.primary} />
              <View>
                <Text style={styles.settingText}>{t('settings.subscription')}</Text>
                {hasPremium && (
                  <Text style={styles.settingDescription}>
                    {subscriptionStatus.hasPremiumYearly 
                      ? t('settings.premiumYearly') 
                      : t('settings.premiumMonthly')}
                  </Text>
                )}
              </View>
            </View>
            {hasPremium ? (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>{t('settings.premium')}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appSettings')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.darkMode')}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{
                false: theme.COLORS.neutral.grey300,
                true: theme.COLORS.primary.main + '80' // 80% opacity
              }}
              thumbColor={darkMode ? theme.COLORS.primary.main : theme.COLORS.white}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={changeLanguage}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="language-outline" size={24} color={theme.COLORS.text.primary} />
              <View>
                <Text style={styles.settingText}>{t('settings.language')}</Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'English' : 
                   language === 'es' ? 'Español' :
                   language === 'fr' ? 'Français' :
                   language === 'zh' ? '中文' : 'English'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="water-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.units')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.helpSupport')}</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.help')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.contactUs')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('TermsAndConditions')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-outline" size={24} color={theme.COLORS.text.primary} />
              <Text style={styles.settingText}>{t('settings.termsConditions')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={24} color={theme.COLORS.text.primary} />
              <View>
                <Text style={styles.settingText}>{t('settings.aboutApp')}</Text>
                <Text style={styles.settingDescription}>
                  PlantSmart v1.0.0 (build 100)
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.COLORS.error.main} />
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.text.secondary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.COLORS.neutral.grey200,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    color: theme.COLORS.text.primary,
  },
  settingDescription: {
    fontSize: 12,
    marginLeft: 12,
    color: theme.COLORS.text.secondary,
  },
  premiumBadge: {
    backgroundColor: theme.COLORS.primary.main,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: theme.COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.error.main,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    color: theme.COLORS.error.main,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsScreen;