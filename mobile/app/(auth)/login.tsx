/**
 * Écran de connexion mobile - AgriConnect
 * Authentification OTP SMS pour agents et producteurs
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
  ActivityIndicator
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

  // Gérer le compte à rebours pour le renvoi d'OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Effacer l'erreur quand l'utilisateur tape
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [phone, otp]);

  // Envoyer l'OTP
  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone');
      return;
    }

    // Formater le numéro de téléphone
    const formattedPhone = formatPhoneNumber(phone.trim());
    if (!formattedPhone || !validatePhoneNumber(formattedPhone)) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone sénégalais valide (ex: +221701234567)');
      return;
    }

    try {
      setIsSendingOTP(true);
      const { error } = await sendOtpSms(formattedPhone);
      
      if (!error) {
        setOtpSent(true);
        setCountdown(60); // 60 secondes avant de pouvoir renvoyer
        Alert.alert('Succès', 'Code de vérification envoyé par SMS');
      } else {
        Alert.alert('Erreur', error.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
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
      setIsVerifyingOTP(true);
      const { user, session, error } = await verifyOtpSms(formattedPhone, otp.trim());
      
      if (!error && user && session) {
        // La redirection se fera automatiquement via useEffect
        Alert.alert('Succès', 'Connexion réussie !');
      } else {
        Alert.alert('Erreur', error?.message || 'Code de vérification incorrect');
        setOtp(''); // Effacer l'OTP incorrect
      }
    } catch (error) {
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
        <ActivityIndicator size="large" color="#3D944B" />
        <Text style={styles.loadingText}>Vérification de la session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="leaf" size={60} color="#3D944B" />
          <Text style={styles.title}>AgriConnect</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          {!otpSent ? (
            // Étape 1: Saisie du numéro de téléphone
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Étape 1: Votre numéro de téléphone</Text>
              <Text style={styles.stepDescription}>
                Saisissez votre numéro de téléphone pour recevoir un code de vérification
              </Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+221 70 123 45 67"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                  editable={!isSendingOTP}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isSendingOTP && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isSendingOTP}
              >
                {isSendingOTP ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.buttonText}>Envoyer le code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // Étape 2: Saisie de l'OTP
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Étape 2: Code de vérification</Text>
              <Text style={styles.stepDescription}>
                Saisissez le code à 6 chiffres envoyé au {phone}
              </Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="key" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  editable={!isVerifyingOTP}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isVerifyingOTP && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isVerifyingOTP}
              >
                {isVerifyingOTP ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.buttonText}>Vérifier le code</Text>
                )}
              </TouchableOpacity>

              {/* Bouton retour et renvoi */}
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackToPhone}
                >
                  <Text style={styles.secondaryButtonText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, countdown > 0 && styles.secondaryButtonDisabled]}
                  onPress={handleResendOTP}
                  disabled={countdown > 0}
                >
                  <Text style={styles.secondaryButtonText}>
                    {countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Ce code est valide pendant 5 minutes
          </Text>
          <Text style={styles.infoText}>
            Seuls les agents et producteurs peuvent se connecter sur mobile
          </Text>
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
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3D944B',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'white',
    width: '100%',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#212121',
  },
  button: {
    backgroundColor: '#3D944B',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: '#3D944B',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default LoginScreen;


