import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/apiConfig";

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync("token"); // ⬅️ 토큰 가져오기
      console.log("🔑 토큰:", token); // ✅ 이 줄 추가
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`, // ⬅️ 토큰 포함
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("사용자 목록을 불러오지 못했습니다.");
      }
  
      const data = await response.json();
  
      const sortedUsers = data.sort((a, b) =>
        a.role === "admin" ? -1 : b.role === "admin" ? 1 : 0
      );
      setUsers(sortedUsers);
    } catch (error) {
      console.error(" 사용자 가져오기 오류:", error);
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };
  

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        
        navigation.navigate("UserDetailScreen", { userId: item.userId });
      }}
    >
      <View style={styles.profileContainer}>
        {item.idImage ? (
          <Image
            source={{ uri: item.idImage }}
            style={styles.profileImage}
          />
        ) : (
          <Ionicons name="person-circle-outline" size={48} color="#007AFF" />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>역할: {item.role}</Text>
        <Text style={styles.userPhone}>전화번호: {item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            사용자 없음
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  userItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: "center",
  },
  profileContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  userInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  userEmail: { fontSize: 15, color: "#666", marginTop: 4 },
  userRole: { fontSize: 14, color: "#888", marginTop: 2 },
  userPhone: { fontSize: 14, color: "#888", marginTop: 2 },
});

export default UserManagementScreen;
