import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function NoticeDetailScreen({ route }) {
  const { noticeId } = route.params;
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNoticeDetail = async () => {
    try {
      const docRef = doc(db, 'notices', noticeId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNotice(docSnap.data());
      } else {
        console.warn('공지사항을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('공지사항 상세 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticeDetail();
  }, [noticeId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNoticeDetail();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!notice) {
    return (
      <View style={styles.center}>
        <Text>공지사항을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.date}>{notice.date}</Text>
      <View style={styles.separator} />
      <Text style={styles.content}>{notice.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#ffffff', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  date: { fontSize: 14, color: '#888', marginBottom: 16 },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  content: { fontSize: 16, lineHeight: 26, color: '#444' },
});
