import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function ApprovedApplicationsScreen() {
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovedApplications = async () => {
    try {
      const q = query(collection(db, 'applications'), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);

      const approvedList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setApprovedApplications(approvedList);
    } catch (error) {
      console.error(' 승인 내역 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedApplications();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>승인 내역 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>승인 완료 내역</Text>
      <FlatList
        data={approvedApplications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.boldText}>지원자: {item.userEmail}</Text>
            <Text>공고명: {item.jobTitle}</Text>
            <Text>
  승인일: {item.approvedAt?.toDate().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })}
</Text>

            <Text>급여: {Number(item.wage).toLocaleString()}원</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>승인된 내역이 없습니다.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 10,
  },
  boldText: { fontWeight: 'bold', marginBottom: 5, color: '#007AFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
