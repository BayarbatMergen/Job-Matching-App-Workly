import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';

export default function AdminJobListScreen({ navigation }) {
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const role = await SecureStore.getItemAsync('userRole');
        
        setIsAdmin(role === 'admin');
      } catch (error) {
        console.error(" 관리자 확인 오류:", error);
      }
    };

    checkAdminStatus();
  }, []);

  const fetchJobs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobListings(jobs);
    } catch (error) {
      console.error(" 모집 공고 불러오기 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchJobs();
    }
  }, [isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const deleteJob = async (jobId) => {
    if (!isAdmin) {
      Alert.alert('권한 오류', '관리자만 공고를 삭제할 수 있습니다.');
      return;
    }
    Alert.alert('삭제 확인', '정말로 이 공고를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'jobs', jobId));
            setJobListings((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
            Alert.alert('삭제 완료', '공고가 삭제되었습니다.');
          } catch (error) {
            console.error(" 공고 삭제 오류:", error);
            Alert.alert('오류 발생', '공고 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>공고 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>관리자 공고 목록</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.approvalButton}
            onPress={() => navigation.navigate('ApprovalScreen')}
          >
            <Ionicons name="checkmark-done-outline" size={24} color="white" />
            <Text style={styles.approvalButtonText}>승인 관리</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={jobListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <TouchableOpacity
              style={styles.jobContent}
              onPress={() =>
                navigation.navigate('AdminJobDetail', {
                  job: item, // 함수 전달 대신 데이터만 넘기기
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>
                  {item.startDate && item.endDate ? `${item.startDate} ~ ${item.endDate}` : '날짜 정보 없음'}
                </Text>
                <Text style={styles.wage}>{Number(item.wage).toLocaleString()}원</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteJob(item.id)}
              disabled={!isAdmin}
            >
              <Ionicons name="trash-outline" size={24} color={isAdmin ? "red" : "gray"} />
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AdminJobForm')}
      >
        <Ionicons name="add-circle-outline" size={28} color="white" />
        <Text style={styles.addButtonText}> 공고 등록</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  approvalButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  approvalButtonText: { color: 'white', marginLeft: 5, fontSize: 14, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  jobContent: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  date: { fontSize: 14, color: '#555', marginBottom: 5 },
  wage: { fontSize: 16, color: 'red', marginBottom: 5 },
  deleteButton: { padding: 8, borderRadius: 5, alignItems: 'center' },
  addButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30
  },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
