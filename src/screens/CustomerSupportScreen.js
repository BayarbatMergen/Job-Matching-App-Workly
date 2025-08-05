import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function CustomerSupportScreen() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert(t('support.inputErrorTitle'), t('support.inputErrorMessage'));
      return;
    }

    try {
      setLoading(true);
      const userEmail = await SecureStore.getItemAsync('userEmail') || t('support.guest');
      const userName = await SecureStore.getItemAsync('userName') || t('support.guest');

      await addDoc(collection(db, 'customerInquiries'), {
        email: userEmail,
        user: userName,
        message,
        reply: '',
        createdAt: Timestamp.now(),
      });

      Alert.alert(t('support.successTitle'), t('support.successMessage'));
      setMessage('');
    } catch (error) {
      console.error(t('support.saveErrorLog'), error);
      Alert.alert(t('support.errorTitle'), t('support.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('support.label')}</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={5}
        value={message}
        onChangeText={setMessage}
        placeholder={t('support.placeholder')}
      />

      <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendButtonText}>{t('support.send')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 10,
    fontSize: 16,
    textAlignVertical: 'top'
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
});