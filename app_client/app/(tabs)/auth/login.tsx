
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
//import EncryptedStorage from 'react-native-encrypted-storage';
import authApi from '@/api/authApi';
import { Formik } from 'formik';
import * as yup from 'yup';

export default function LoginScreen() {
  const navigation = useNavigation();
  

  // State Management
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // !UNKNOWN: On the web, 'Remember Me' usually keeps the session cookie alive.
  // On mobile, this typically means "Pre-fill my email next time".

  // Pre-fill remembered email
  const [initialEmail, setInitialEmail] = useState('');
  {/*useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await EncryptedStorage.getItem('remembered_email');
        if (savedEmail) {
          setInitialEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Failed to load saved email');
      }
    };
    loadSavedEmail();
  }, []);*/}


  // Yup validation schema
  const loginValidationSchema = yup.object().shape({
    email: yup
      .string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: yup
      .string()
      .min(6, ({ min }) => `Password must be at least ${min} characters`)
      .required('Password is required'),
  });


  // Formik submit handler (API commented for layout/dev only)
  const handleLogin = async (values : any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    setFormError('');
    setIsLoading(true);
    try {
      // --- API login is commented out for layout/dev only ---
      // const response = await authApi.login(values.email, values.password);
      // if (response?.data?.success) {
      //   const { token, user } = response.data.data;
      //   await EncryptedStorage.setItem('auth_token', token);
      //   await EncryptedStorage.setItem('user_data', JSON.stringify(user));
      //   if (rememberMe) {
      //     await EncryptedStorage.setItem('remembered_email', values.email);
      //   } else {
      //     await EncryptedStorage.removeItem('remembered_email');
      //   }
      //   navigation.reset({
      //     index: 0,
      //     routes: [{ name: '(tabs)' as never }],
      //   });
      // } else {
      //   throw new Error(response?.data?.message || 'Login failed');
      // }

      // --- Default redirect for layout/dev ---
      // Use static credentials for testing: sonicprime1963@gmail.com / 05042005
      // To test protected screens, you can set a static token here:
      // await EncryptedStorage.setItem('auth_token', '<STATIC_TOKEN_HERE>');
      // await EncryptedStorage.setItem('user_data', JSON.stringify({ email: 'sonicprime1963@gmail.com' }));
      navigation.reset({
        index: 0,
        routes: [{ name: '(tabs)' as never }],
      });
    } catch (err) {
      setFormError('Dev redirect failed');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    // !UNKNOWN: Missing Native Google Sign-In Configuration
    // Web uses window.google (GSI). React Native REQUIRES '@react-native-google-signin/google-signin'.
    // You cannot use the web code here.
    Alert.alert(
      "Configuration Needed", 
      "Google Sign-In requires native module installation (@react-native-google-signin/google-signin) and SHA-1 key setup in Firebase console."
    );
    
    /* IMPLEMENTATION PLAN:
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const res = await authApi.loginWithGoogle(userInfo.idToken); 
      // ... handle token storage as above ...
    } catch (error) { ... }
    */
  };


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Sign in to your account</Text>
        </View>
        <View style={styles.card}>
          <Formik
            initialValues={{ email: initialEmail, password: '' }}
            enableReinitialize
            validationSchema={loginValidationSchema}
            onSubmit={handleLogin}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                {/* Global Form Error */}
                {formError ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{formError}</Text>
                  </View>
                ) : null}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email address</Text>
                  <View style={[styles.inputContainer, errors.email && touched.email ? styles.inputErrorBorder : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="you@greenspace.com"
                      placeholderTextColor="#9CA3AF"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  {errors.email && touched.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.passwordHeader}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity>
                      <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputContainer, errors.password && touched.password ? styles.inputErrorBorder : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      secureTextEntry={!isPasswordVisible}
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                      <Text style={{color: '#6B7280', fontSize: 12}}>{isPasswordVisible ? "HIDE" : "SHOW"}</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.password && touched.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                {/* Remember Me */}
                <TouchableOpacity 
                  style={styles.rememberMeRow} 
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handleSubmit as any} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Formik>

          {/* Google Sign In Placeholder */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity style={styles.createAccountButton}>
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles adapted from the Emerald/Green theme in LoginForm.jsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827', // gray-900
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#059669', // emerald-600 shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5, // Android shadow
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)', // emerald-100/70
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 12,
  },
  inputErrorBorder: {
    borderColor: '#EF4444', // red-500
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827', // gray-900
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: '#047857', // emerald-700
    fontWeight: '500',
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669', // emerald-600
    borderColor: '#059669',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#374151', // gray-700
  },
  button: {
    backgroundColor: '#059669', // emerald-600
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444', // red-600
    fontSize: 12,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2', // red-50
    borderWidth: 1,
    borderColor: '#FEE2E2', // red-100
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C', // red-700
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB', // gray-200
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#6B7280', // gray-500
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    borderRadius: 8,
    marginBottom: 16,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  createAccountButton: {
    width: '100%',
    padding: 12,
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#047857', // emerald-700
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280', // gray-500
    marginTop: 16,
  },
});