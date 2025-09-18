/**
 * Écran de connexion mobile - AgriConnect
 * Design moderne inspiré de l'image fournie
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { 
  sendOtpSms, 
  verifyOtpSms, 
  formatPhoneNumber, 
  validatePhoneNumber 
} from '../../lib/auth/mobileAuthService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Clipboard: use dynamic import for native, and navigator.clipboard on web
import { Platform as RNPlatform } from 'react-native';

const getClipboardText = async (): Promise<string> => {
  if (RNPlatform.OS === 'web' && typeof navigator !== 'undefined' && 'clipboard' in navigator) {
    try {
      // @ts-ignore web clipboard API
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  }
  try {
    const Clipboard = await import('expo-clipboard');
    return await Clipboard.getStringAsync();
  } catch {
    return '';
  }
};

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [hasVerifiedSuccess, setHasVerifiedSuccess] = useState(false);
  const otpHiddenInputRef = React.useRef<TextInput>(null);
  const isSendingOTPRef = React.useRef(false);
  
  // Protection globale contre les appels multiples
  const lastCallTimeRef = React.useRef(0);

  const maskedPhone = React.useMemo(() => {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const formatted = formatPhoneNumber(cleaned) || cleaned;
    // +221 77 *** ** 45
    const digits = formatted.replace(/[^0-9]/g, '');
    if (digits.length >= 11) {
      const p2 = digits.slice(-9, -7); // 2
      const last2 = digits.slice(-2);
      return `+221 ${p2} ** ** ${last2}`;
    }
    return formatted || phone;
  }, [phone]);

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  // Effacer l'erreur au montage
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Gestion du countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Envoyer l'OTP
  const handleSendOTP = useCallback(async () => {
    const now = Date.now();
    console.log('🔍 [LOGIN] handleSendOTP - APPEL DÉTECTÉ - isSendingOTPRef.current:', isSendingOTPRef.current, 'lastCall:', lastCallTimeRef.current, 'diff:', now - lastCallTimeRef.current);
    
    // Protection temporelle - ignorer si appelé dans les 2 secondes
    if (now - lastCallTimeRef.current < 2000) {
      console.log('🚫 [LOGIN] handleSendOTP - Appel trop récent, ignorer (diff:', now - lastCallTimeRef.current, 'ms)');
      return;
    }
    
    // Protection contre les double-taps - IMMÉDIATEMENT avec ref
    if (isSendingOTPRef.current) {
      console.log('🚫 [LOGIN] handleSendOTP - Déjà en cours, ignorer');
      return;
    }

    // Marquer le temps de l'appel et comme en cours
    lastCallTimeRef.current = now;
    isSendingOTPRef.current = true;
    setIsSendingOTP(true);
    console.log('📱 [LOGIN] handleSendOTP - Numéro saisi:', phone);
    
    const formattedPhone = formatPhoneNumber(phone.trim());
    if (!formattedPhone) {
      console.log('❌ [LOGIN] handleSendOTP - Numéro non formatable:', phone);
      Alert.alert('Erreur', 'Numéro de téléphone invalide. Utilisez le format: 70 123 45 67');
      isSendingOTPRef.current = false;
      setIsSendingOTP(false);
      return;
    }

    if (!validatePhoneNumber(formattedPhone)) {
      console.log('❌ [LOGIN] handleSendOTP - Numéro non valide:', formattedPhone);
      Alert.alert('Erreur', 'Format de numéro invalide. Utilisez le format: 70 123 45 67');
      isSendingOTPRef.current = false;
      setIsSendingOTP(false);
      return;
    }

    try {
      console.log('📱 [LOGIN] handleSendOTP - Début avec téléphone:', formattedPhone);
      
      const { error } = await sendOtpSms(formattedPhone);
      
      if (!error) {
        console.log('✅ [LOGIN] handleSendOTP - OTP envoyé avec succès');
        setOtpSent(true);
        setCountdown(60); // 60 secondes avant de pouvoir renvoyer
        Alert.alert('Succès', 'Code de vérification envoyé par SMS');
      } else {
        console.log('❌ [LOGIN] handleSendOTP - Erreur:', error.message);
        Alert.alert('Erreur', error.message || 'Erreur lors de l\'envoi du code');
      }
    } catch {
      Alert.alert('Erreur', 'Erreur lors de l\'envoi du code de vérification');
    } finally {
      isSendingOTPRef.current = false;
      setIsSendingOTP(false);
    }
  }, [phone]);

  // Vérifier l'OTP
  const handleVerifyOTP = async () => {
    if (isVerifyingOTP || hasVerifiedSuccess) {
      return;
    }
    if (!otp.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le code de vérification');
      return;
    }

    if (otp.trim().length !== 6) {
      Alert.alert('Erreur', 'Le code de vérification doit contenir 6 chiffres');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone.trim());
    if (!formattedPhone) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide');
      return;
    }

    try {
      console.log('📱 [LOGIN] handleVerifyOTP - Début avec téléphone:', formattedPhone, 'OTP:', otp.trim());
      setIsVerifyingOTP(true);
      
      const { user, session, error } = await verifyOtpSms(formattedPhone, otp.trim());
      
      console.log('📱 [LOGIN] handleVerifyOTP - Résultat:', {
        hasUser: !!user,
        hasSession: !!session,
        hasError: !!error,
        errorMessage: error?.message
      });
      
      if (!error && user && session) {
        console.log('✅ [LOGIN] handleVerifyOTP - Connexion réussie, vérification du profil...');
        
        // Vérifier si l'utilisateur a un profil
        const { userProfileExists } = await import('../../lib/auth/mobileAuthService');
        const hasProfile = await userProfileExists(user.id);
        
        if (!hasProfile) {
          console.log('👤 [LOGIN] handleVerifyOTP - Pas de profil, redirection vers sélection de rôle...');
          const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
          setHasVerifiedSuccess(true);
          router.replace({ pathname: '/(auth)/role-selection', params: { displayName } as any });
        } else {
          console.log('✅ [LOGIN] handleVerifyOTP - Profil existant, redirection vers l\'app...');
          setHasVerifiedSuccess(true);
          router.replace('/(tabs)');
        }
      } else {
        console.log('❌ [LOGIN] handleVerifyOTP - Échec de la connexion:', error?.message);
        Alert.alert('Erreur', error?.message || 'Code de vérification incorrect');
        setOtp(''); // Effacer l'OTP incorrect
      }
    } catch {
      console.log('❌ [LOGIN] handleVerifyOTP - Exception lors de la vérification');
      Alert.alert('Erreur', 'Erreur lors de la vérification du code');
      setOtp('');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Renvoyer l'OTP
  const handleResendOTP = () => {
    if (countdown > 0) return;
    handleSendOTP();
  };

  // Retour à la saisie du numéro
  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtp('');
    setCountdown(0);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#3D944B', '#2E7D32']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#3D944B" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={24} color="#3D944B" />
            <Text style={styles.logoText}>AgriConnect</Text>
          </View>
          <View style={styles.mainIcon}>
            <Ionicons name="leaf" size={40} color="white" />
          </View>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Entrez vos informations pour continuer</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {!otpSent ? (
            // Étape 1: Saisie du numéro de téléphone
            <View style={styles.stepContainer}>
              <Text style={styles.inputLabel}>Prénom</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Votre prénom"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Votre nom"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <View style={styles.inputContainer}>
                <View style={styles.flagContainer}>
                  <View style={styles.flagGreen} />
                  <View style={styles.flagYellow} />
                  <View style={styles.flagRed} />
                </View>
                <Text style={styles.countryCode}>+221</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="70 123 45 67"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSendingOTP && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isSendingOTP || !phone.trim() || !firstName.trim() || !lastName.trim()}
              >
                {isSendingOTP ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Envoyer le code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Étape 2: Vérification OTP (design amélioré)
            <View style={styles.stepContainer}>
              <View style={styles.lockIconBox}>
                <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.verifyTitle}>Entrez le code</Text>
              <Text style={styles.verifySubtitle}>Un code à 6 chiffres a été envoyé au</Text>
              <Text style={styles.verifyPhone}>{maskedPhone}</Text>
              
              {/* Message pour les numéros de test */}
              {(phone === '770951543' || phone === '775478724') && (
                <View style={styles.testInfo}>
                  <Text style={styles.testInfoText}>
                    🎯 Mode test : Utilisez le code <Text style={styles.testCode}>123456</Text>
                  </Text>
                </View>
              )}

              {/* OTP boxes */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => otpHiddenInputRef.current?.focus()}
                style={styles.otpBoxesRow}
              >
                {[0,1,2,3,4,5].map((i) => (
                  <View key={i} style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}>
                    <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
                  </View>
                ))}
              </TouchableOpacity>

              {/* Hidden input to capture OTP */}
              <TextInput
                ref={otpHiddenInputRef}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g,'').slice(0,6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.otpHiddenInput}
              />

              {/* Paste button */}
              <TouchableOpacity
                style={styles.pasteButton}
                onPress={async () => {
                  const text = await getClipboardText();
                  const onlyDigits = (text || '').replace(/\D/g,'').slice(0,6);
                  if (onlyDigits.length > 0) setOtp(onlyDigits);
                }}
              >
                <Ionicons name="clipboard" size={16} color="#3D944B" />
                <Text style={styles.pasteText}>Coller le code</Text>
              </TouchableOpacity>

              {/* Countdown and resend */}
              <View style={styles.expiryRow}>
                <Ionicons name="time-outline" size={16} color="#8A8A8A" />
                <Text style={styles.expiryText}>Code expire dans </Text>
                <Text style={styles.expiryCountdown}>{`00:${String(Math.max(countdown,0)).padStart(2,'0')}`}</Text>
              </View>
              {countdown > 0 ? (
                <Text style={styles.resendDisabled}>Renvoyer le code</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.resendLink}>Renvoyer le code</Text>
                </TouchableOpacity>
              )}

              {/* Validate button */}
              <TouchableOpacity
                style={[styles.primaryButton, (isVerifyingOTP || hasVerifiedSuccess) && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isVerifyingOTP || hasVerifiedSuccess || otp.length !== 6}
              >
                {isVerifyingOTP ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Valider</Text>
                )}
              </TouchableOpacity>

              {/* Modify number */}
              <TouchableOpacity style={styles.modifyButton} onPress={handleBackToPhone}>
                <Ionicons name="create-outline" size={16} color="#3D944B" />
                <Text style={styles.modifyButtonText}>Modifier le numéro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 15,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  mainIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#3D944B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingVertical: 20,
  },
  stepContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#333',
  },
  flagContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  flagGreen: {
    width: 4,
    height: 12,
    backgroundColor: '#00853F',
  },
  flagYellow: {
    width: 4,
    height: 12,
    backgroundColor: '#FCD116',
  },
  flagRed: {
    width: 4,
    height: 12,
    backgroundColor: '#CE1126',
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#3D944B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#666',
  },
  // Styles pour l'étape OTP
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 200,
  },
  otpHiddenInput: {
    position: 'absolute',
    height: 0,
    width: 0,
    opacity: 0,
  },
  lockIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3D944B',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  verifySubtitle: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
  },
  verifyPhone: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 12,
  },
  testInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  testInfoText: {
    fontSize: 13,
    color: '#1565C0',
    textAlign: 'center',
    fontWeight: '500',
  },
  testCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D47A1',
    fontFamily: 'monospace',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 6,
    marginTop: 8,
    marginBottom: 10,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: '#3D944B',
    shadowColor: '#3D944B',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  pasteButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#3D944B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pasteText: {
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 8,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    gap: 6,
  },
  expiryText: {
    color: '#6B7280',
    fontSize: 14,
  },
  expiryCountdown: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '700',
  },
  resendDisabled: {
    textAlign: 'center',
    color: '#98A2B3',
    marginBottom: 8,
  },
  resendLink: {
    textAlign: 'center',
    color: '#3D944B',
    fontWeight: '600',
    marginBottom: 8,
  },
  modifyButton: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modifyButtonText: {
    color: '#111827',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#3D944B',
    fontWeight: '500',
    marginLeft: 4,
  },
  countdownText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#3D944B',
    fontWeight: '500',
  },
});

export default LoginScreen;