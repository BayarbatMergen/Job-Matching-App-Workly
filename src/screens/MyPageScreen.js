import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, Modal, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { logout } from "../services/authService";
import API_BASE_URL from "../config/apiConfig";

//  기본 이미지 처리 함수
const getValidImageUrl = (url) => {
  if (!url || url === 'null') {
    return 'https://via.placeholder.com/100x100?text=No+Image';
  }
  return url;
};

export default function MyPageScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("인증 오류", "로그인이 필요합니다.", [
          { text: "확인", onPress: () => navigation.replace("Login") },
        ]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const errorData = await response.text();
      if (!response.ok) {
        throw new Error(JSON.parse(errorData).message || "서버 오류");
      }

      const userInfo = JSON.parse(errorData);
      setUserData(userInfo);
    } catch (error) {
      console.error("사용자 정보 오류:", error);
      Alert.alert("오류", error.message || "사용자 정보를 불러올 수 없습니다.", [
        { text: "확인", onPress: () => navigation.replace("Login") },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setLogoutModalVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert("오류", "로그아웃에 실패했습니다.");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={[userData]} // dummy data to enable FlatList
      keyExtractor={() => 'user-info'}
      renderItem={() => (
        <>
          {/* 프로필 영역 */}
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: getValidImageUrl(userData?.idImage) }}
              style={styles.profileImage}
            />
            <Text style={styles.userName}>{userData?.name || "이름 없음"}</Text>
            <Text style={styles.userEmail}>{userData?.email || "이메일 없음"}</Text>
          </View>

          {/* 설정 메뉴 */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BankInfo')}>
              <Ionicons name="card-outline" size={26} color="#007AFF" />
              <Text style={styles.menuText}>계좌 정보 변경</Text>
              <Ionicons name="chevron-forward" size={22} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ChangePassword', { email: userData.email })}>
              <Ionicons name="key-outline" size={26} color="#007AFF" />
              <Text style={styles.menuText}>비밀번호 변경</Text>
              <Ionicons name="chevron-forward" size={22} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          {/* 기타 메뉴 */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notice')}>
              <Ionicons name="megaphone-outline" size={26} color="#007AFF" />
              <Text style={styles.menuText}>공지사항</Text>
              <Ionicons name="chevron-forward" size={22} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerSupport')}>
              <Ionicons name="help-circle-outline" size={26} color="#007AFF" />
              <Text style={styles.menuText}>고객센터 문의하기</Text>
              <Ionicons name="chevron-forward" size={22} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyInquiriesScreen')}>
              <Ionicons name="chatbox-ellipses-outline" size={26} color="#007AFF" />
              <Text style={styles.menuText}>내 문의 내역 보기</Text>
              <Ionicons name="chevron-forward" size={22} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          {/* 로그아웃 버튼 */}
          <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutModalVisible(true)}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </>
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
      }
      contentContainerStyle={{ paddingBottom: 40 }}
      ListFooterComponent={
        <Modal visible={logoutModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Ionicons name="log-out-outline" size={40} color="#FF3B30" />
              <Text style={styles.modalTitle}>로그아웃 하시겠습니까?</Text>
              <Text style={styles.modalText}>현재 계정에서 로그아웃합니다.</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleLogout}>
                  <Text style={styles.confirmButtonText}>로그아웃</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 25,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileImage: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: '#fff', marginBottom: 10,
  },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userEmail: { fontSize: 16, color: '#E0E0E0' },
  section: {
    backgroundColor: '#fff', marginTop: 15,
    borderRadius: 12, paddingVertical: 5, elevation: 3,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  menuText: { fontSize: 17, marginLeft: 15, color: '#333', flex: 1, fontWeight: '500' },
  logoutButton: {
    backgroundColor: '#FF3B30', padding: 15,
    borderRadius: 10, alignItems: 'center',
    marginVertical: 30, marginHorizontal: 20,
  },
  logoutText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { width: '80%', padding: 20, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#333', textAlign: 'center' },
  modalText: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 10 },
  buttonRow: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between', width: '100%' },
  cancelButton: { flex: 1, backgroundColor: '#ddd', paddingVertical: 12, borderRadius: 10, marginRight: 10, alignItems: 'center' },
  cancelButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  confirmButton: { flex: 1, backgroundColor: '#FF3B30', paddingVertical: 12, borderRadius: 10, marginLeft: 10, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
