import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL from '../config/apiConfig';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('changePassword.inputErrorTitle'), t('changePassword.inputErrorMessage'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('changePassword.mismatchTitle'), t('changePassword.mismatchMessage'));
      return;
    }

    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync('token');

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(t('changePassword.successTitle'), t('changePassword.successMessage'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert(t('changePassword.failureTitle'), result.message || t('changePassword.failureMessage'));
      }
    } catch (error) {
      console.error(t('changePassword.errorLog'), error);
      Alert.alert(t('changePassword.serverErrorTitle'), t('changePassword.serverErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('changePassword.currentPassword')}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder={t('changePassword.currentPasswordPlaceholder')}
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>{t('changePassword.newPassword')}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={t('changePassword.newPasswordPlaceholder')}
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>{t('changePassword.confirmPassword')}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t('changePassword.confirmPasswordPlaceholder')}
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{t('changePassword.submitButton')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});