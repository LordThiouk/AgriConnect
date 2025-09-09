/**
 * Écran de connexion mobile - AgriConnect
 * Design moderne inspiré de l'image fournie
 */

import React, { useState, useEffect } from 'react';
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
  StatusBar,
  Dimensions
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

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);

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
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Envoyer l'OTP
  const handleSendOTP = async () => {
    const formattedPhone = formatPhoneNumber(phone.trim());
    if (!formattedPhone) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide');
      return;
    }

    if (!validatePhoneNumber(formattedPhone)) {
      Alert.alert('Erreur', 'Format de numéro invalide. Utilisez le format +221XXXXXXXXX');
      return;
    }

    try {
      console.log('📱 [LOGIN] handleSendOTP - Début avec téléphone:', formattedPhone);
      setIsSendingOTP(true);
      
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
      setIsSendingOTP(false);
    }
  };

  // Vérifier l'OTP
  const handleVerifyOTP = async () => {
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
          router.replace('/(auth)/role-selection');
        } else {
          console.log('✅ [LOGIN] handleVerifyOTP - Profil existant, redirection vers l\'app...');
          // La redirection se fera automatiquement via useEffect
          Alert.alert('Succès', 'Connexion réussie !');
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
      
      <LinearGradient
        colors={['#3D944B', '#2E7D32']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="leaf" size={60} color="white" />
          <Text style={styles.title}>AgriConnect</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {!otpSent ? (
            // Étape 1: Saisie du numéro de téléphone
            <View style={styles.stepContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="+221 77 123 45 67"
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
                disabled={isSendingOTP || !phone.trim()}
              >
                {isSendingOTP ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Se connecter</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>

              

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Étape 2: Vérification OTP
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Code de vérification</Text>
              <Text style={styles.stepDescription}>
                Entrez le code à 6 chiffres envoyé au {phone}
              </Text>

              <View style={styles.otpContainer}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isVerifyingOTP && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isVerifyingOTP || otp.length !== 6}
              >
                {isVerifyingOTP ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Vérifier le code</Text>
                    <Ionicons name="checkmark" size={20} color="white" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>

              {/* Actions secondaires */}
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackToPhone}
                >
                  <Ionicons name="arrow-back" size={16} color="#3D944B" />
                  <Text style={styles.secondaryButtonText}>Retour</Text>
                </TouchableOpacity>

                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Renvoyer dans {countdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendOTP}
                  >
                    <Text style={styles.resendButtonText}>Renvoyer le code</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
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
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#3D944B',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#3D944B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    color: '#3D944B',
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3D944B',
    fontWeight: '500',
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
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
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
