import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';

export default function MyInquiriesScreen() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const userEmail = await SecureStore.getItemAsync('userEmail');
        if (!userEmail) return;

        const q = query(
          collection(db, 'customerInquiries'),
          where('email', '==', userEmail),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setInquiries(data);
      } catch (error) {
        console.error(' 내 문의 내역 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

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
            <Text style={styles.label}>문의 내용:</Text>
            <Text style={styles.message}>{item.message}</Text>

            {item.createdAt && (
              <Text style={styles.date}>
                {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
              </Text>
            )}

            {item.reply ? (
              <View style={styles.replyBox}>
                <Text style={styles.replyLabel}>관리자 답변:</Text>
                <Text style={styles.replyContent}>{item.reply}</Text>
              </View>
            ) : (
              <Text style={styles.pending}>답변 대기 중입니다.</Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>문의 내역이 없습니다.</Text>}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inquiryBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  label: { fontWeight: 'bold', fontSize: 15, marginBottom: 5, color: '#555' },
  message: { fontSize: 16, color: '#333', marginBottom: 10 },
  date: { fontSize: 13, color: '#999', marginBottom: 10, textAlign: 'right' },
  replyBox: {
    backgroundColor: '#E6F0FD',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 10,
  },
  replyLabel: { fontWeight: 'bold', color: '#007AFF', marginBottom: 5 },
  replyContent: { fontSize: 15, color: '#333' },
  pending: { color: '#FF8C00', fontStyle: 'italic', marginTop: 10 },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 30, fontSize: 16 },
});
