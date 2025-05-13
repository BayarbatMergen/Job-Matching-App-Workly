import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function CustomerInquiryScreen() {
  const [inquiries, setInquiries] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [loading, setLoading] = useState(true);

  //  Firestore에서 문의 내역 가져오기
  const fetchInquiries = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'customerInquiries'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInquiries(data);
    } catch (error) {
      console.error(' 문의 내역 불러오기 실패:', error);
      Alert.alert('오류', '문의 내역을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // 답장 입력값 변경
  const handleReplyChange = (id, text) => {
    setReplyText((prev) => ({ ...prev, [id]: text }));
  };

  //  Firestore에 답장 업데이트
  const handleSendReply = async (id) => {
    const reply = replyText[id];
    if (!reply || reply.trim() === '') {
      Alert.alert('경고', '답장을 입력해주세요.');
      return;
    }

    try {
      const inquiryRef = doc(db, 'customerInquiries', id);
      await updateDoc(inquiryRef, { reply });

      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, reply } : inq))
      );
      Alert.alert('완료', '답장이 성공적으로 등록되었습니다.');
      setReplyText((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error(' 답장 전송 오류:', error);
      Alert.alert('오류', '답장 전송에 실패했습니다.');
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
      <FlatList
        data={inquiries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.inquiryBox}>
            <Text style={styles.userText}>{item.user || '사용자'}:</Text>
            <Text style={styles.messageText}>{item.message}</Text>

            {item.reply ? (
              <View style={styles.replyBox}>
                <Text style={styles.replyText}>답변:</Text>
                <Text style={styles.replyContent}>{item.reply}</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="답장을 입력하세요"
                  value={replyText[item.id] || ''}
                  onChangeText={(text) => handleReplyChange(item.id, text)}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handleSendReply(item.id)}
                >
                  <Text style={styles.sendButtonText}>전송</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inquiryBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  userText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  messageText: { fontSize: 15, marginBottom: 10, color: '#444' },
  input: {
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  replyBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  replyText: { fontWeight: 'bold', color: '#007AFF', fontSize: 15 },
  replyContent: { fontSize: 15, marginTop: 5, color: '#333' },
});
