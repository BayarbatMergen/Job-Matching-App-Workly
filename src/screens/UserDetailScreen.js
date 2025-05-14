import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from "../config/apiConfig";

export default function UserDetailScreen({ route }) {
  const { userId } = route.params;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = async () => {
    try {
      
      const response = await fetch(`${API_BASE_URL}/api/admin/user/${userId}`);
      if (!response.ok) {
        throw new Error('사용자 정보를 가져오는 데 실패했습니다.');
      }
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error(' 사용자 정보 가져오기 실패:', error);
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchUserDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text>사용자 데이터를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {userData.idImage ? (
          <Image source={{ uri: userData.idImage }} style={styles.profileImage} />
        ) : (
          <Ionicons name="person-circle-outline" size={120} color="#007AFF" />
        )}
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userRole}>({userData.role})</Text>
      </View>

      <View style={styles.detailCard}>
        {Object.entries(userData).map(([key, value]) => {
          let displayValue = value;

          // createdAt 처리
          if (key === 'createdAt' && value?._seconds) {
            const date = new Date(value._seconds * 1000);
            displayValue = date.toLocaleString();
          }

          // 긴 문자열은 자르기
          if (typeof value === 'string' && value.length > 60) {
            displayValue = value.slice(0, 57) + '...';
          }

          // password는 표시하지 않음
          if (key === 'password') return null;

          return (
            <View style={styles.detailRow} key={key}>
              <Text style={styles.detailKey}>{key}</Text>
              <Text style={styles.detailValue}>{displayValue ? String(displayValue) : '없음'}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F0F4F8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 2, borderColor: '#007AFF' },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  userRole: { fontSize: 18, color: '#777', marginBottom: 20 },
  detailCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  detailKey: { fontWeight: 'bold', color: '#444', fontSize: 15 },
  detailValue: { color: '#555', fontSize: 15, maxWidth: '60%', textAlign: 'right' },
});

