import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from '../config/firebase';
import { fetchUserData } from '../services/authService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function BankInfoScreen() {
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
          Alert.alert("인증 오류", "로그인이 필요합니다.");
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
        console.error(" 계좌 정보 불러오기 오류:", error);
        Alert.alert("오류", "계좌 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadUserBankInfo();
  }, []);

  const handleSaveNewAccount = async () => {
    if (!newBankName || !newAccountNumber) {
      Alert.alert('입력 오류', '새 계좌 정보를 모두 입력해주세요.');
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

      Alert.alert(' 저장 완료', `은행: ${newBankName}\n계좌번호: ${newAccountNumber}`);
    } catch (error) {
      console.error(" 계좌 저장 오류:", error);
      Alert.alert('오류', '계좌 정보 저장에 실패했습니다.');
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
        <Text style={styles.sectionTitle}>기존 등록된 계좌</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>은행명</Text>
          <Text style={styles.infoText}>{existingBankInfo.bankName || '등록된 계좌 없음'}</Text>

          <Text style={styles.label}>계좌번호</Text>
          <Text style={styles.infoText}>{existingBankInfo.accountNumber || '등록된 계좌 없음'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>새 계좌 등록</Text>
        <TextInput
          style={styles.input}
          value={newBankName}
          onChangeText={setNewBankName}
          placeholder="새 은행명을 입력하세요"
        />
        <TextInput
          style={styles.input}
          value={newAccountNumber}
          onChangeText={setNewAccountNumber}
          placeholder="새 계좌번호를 입력하세요"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveNewAccount}>
          <Text style={styles.saveButtonText}>새 계좌 저장</Text>
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
