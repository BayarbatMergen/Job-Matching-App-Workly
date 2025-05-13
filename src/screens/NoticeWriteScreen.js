import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_BASE_URL } from "../config/apiConfig";

export default function NoticeWriteScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handlePostNotice = async () => {
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력하세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('입력 오류', '공지사항 내용을 입력하세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/notice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          author: '갱이', // 필요 시 SecureStore에서 가져오도록 수정 가능
        }),
      });

      if (!response.ok) {
        throw new Error('공지사항 등록 실패');
      }

      Alert.alert('성공', '공지사항이 등록되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error(' 공지사항 등록 오류:', error);
      Alert.alert('오류', '공지사항 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>공지사항 작성</Text>
      
      <Text style={styles.label}>제목</Text>
      <TextInput
        style={styles.input}
        placeholder="제목을 입력하세요"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>내용</Text>
      <TextInput
        style={styles.textArea}
        placeholder="공지 내용을 입력하세요..."
        multiline
        value={content}
        onChangeText={setContent}
      />

      <TouchableOpacity style={styles.button} onPress={handlePostNotice}>
        <Text style={styles.buttonText}>등록하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '500', marginTop: 10, marginBottom: 5 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  textArea: {
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
