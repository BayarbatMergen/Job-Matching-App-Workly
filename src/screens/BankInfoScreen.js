import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from '../config/firebase';
import { fetchUserData } from '../services/authService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function BankInfoScreen() {
  const { t } = useTranslation();
  const [existingBankInfo, setExistingBankInfo] = useState({ bankName: '', accountNumber: '' });
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserBankInfo = async () => {
      try {
        const userData = await fetchUserData();
        if (!userData || !userData.userId) {
          Alert.alert(t("alert.authErrorTitle"), t("alert.loginRequiredMessage"));
          return;
        }
        setUserId(userData.userId);

        const userDocRef = doc(db, 'users', userData.userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setExistingBankInfo({
            bankName: userData.bank || '',
            accountNumber: userData.accountNumber || '',
          });
        }
      } catch (error) {
        console.error("계좌 정보 불러오기 오류:", error);
        Alert.alert(t("common.error"), t("bankInfo.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    loadUserBankInfo();
  }, []);

  const handleSaveNewAccount = async () => {
    if (!newBankName || !newAccountNumber) {
      Alert.alert(t("bankInfo.inputErrorTitle"), t("bankInfo.inputErrorMessage"));
      return;
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        bank: newBankName,
        accountNumber: newAccountNumber,
      });

      setExistingBankInfo({ bankName: newBankName, accountNumber: newAccountNumber });
      setNewBankName('');
      setNewAccountNumber('');

      Alert.alert(t("bankInfo.successTitle"), `${t("bankInfo.bank")}: ${newBankName}\n${t("bankInfo.accountNumber")}: ${newAccountNumber}`);
    } catch (error) {
      console.error("계좌 저장 오류:", error);
      Alert.alert(t("common.error"), t("bankInfo.saveError"));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("bankInfo.currentTitle")}</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>{t("bankInfo.bank")}</Text>
          <Text style={styles.infoText}>{existingBankInfo.bankName || t("bankInfo.noBankInfo")}</Text>

          <Text style={styles.label}>{t("bankInfo.accountNumber")}</Text>
          <Text style={styles.infoText}>{existingBankInfo.accountNumber || t("bankInfo.noBankInfo")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("bankInfo.newTitle")}</Text>
        <TextInput
          style={styles.input}
          value={newBankName}
          onChangeText={setNewBankName}
          placeholder={t("bankInfo.placeholder.bank")}
        />
        <TextInput
          style={styles.input}
          value={newAccountNumber}
          onChangeText={setNewAccountNumber}
          placeholder={t("bankInfo.placeholder.account")}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveNewAccount}>
          <Text style={styles.saveButtonText}>{t("bankInfo.saveButton")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 20, padding: 15, backgroundColor: '#F8F8F8', borderRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  infoBox: { padding: 10, backgroundColor: '#EAEAEA', borderRadius: 8 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  infoText: { fontSize: 16, color: '#007AFF', marginTop: 5 },
  input: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
