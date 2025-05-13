import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function CustomerSupportScreen() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('입력 오류', '문의 내용을 입력해주세요.');
      return;
    }
  
    try {
      setLoading(true);
      const userEmail = await SecureStore.getItemAsync('userEmail') || '비회원';
      const userName = await SecureStore.getItemAsync('userName') || '비회원';
  
      await addDoc(collection(db, 'customerInquiries'), {
        email: userEmail,
        user: userName, //  사용자 이름 추가 저장
        message,
        reply: '',      //  reply 필드 초기화
        createdAt: Timestamp.now(),
      });
  
      Alert.alert('문의 완료', '고객센터에 문의가 접수되었습니다.');
      setMessage('');
    } catch (error) {
      console.error(' 문의 저장 오류:', error);
      Alert.alert('오류', '문의 전송 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>문의 내용</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={5}
        value={message}
        onChangeText={setMessage}
        placeholder="문의 내용을 입력하세요"
      />

      <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendButtonText}>보내기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { height: 120, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, paddingTop: 10, fontSize: 16, textAlignVertical: 'top' },
  sendButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  sendButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
