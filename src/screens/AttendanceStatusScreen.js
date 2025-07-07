import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function AttendanceStatusScreen({ route }) {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedDate = route.params?.date;

  const fetchAttendance = async () => {
    try {
      const snapshot = await getDocs(collection(db, "attendance"));
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (selectedDate) {
        list = list.filter(item => item.date === selectedDate);
      }

      // 최신 날짜 순
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceList(list);
    } catch (err) {
      console.error("출근 현황 불러오기 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>출근 현황 불러오는 중...</Text>
      </View>
    );
  }

  return (
<ScrollView style={styles.container}>
  <View>
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.cell, styles.headerText]}>날짜</Text>
      <Text style={[styles.cell, styles.headerText]}>성명</Text>
      <Text style={[styles.cell, styles.headerText]}>출근 시간</Text>
    </View>
    {attendanceList.length > 0 ? (
      attendanceList.map((att, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.cell}>{att.date}</Text>
          <Text style={styles.cell}>{att.name || att.userId}</Text>
          <Text style={styles.cell}>{new Date(att.time).toLocaleString()}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.noData}>출근 기록이 없습니다.</Text>
    )}
  </View>
</ScrollView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingVertical: 20, paddingHorizontal: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingVertical: 12,
    width: '100%'  // ✅ 중요: 화면 가득 차게
  },
  header: {
    backgroundColor: '#007AFF',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#333'
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  noData: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#AAA'
  }
});
