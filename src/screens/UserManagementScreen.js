import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import API_BASE_URL from "../config/apiConfig";

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  await fetchUsers();
  setRefreshing(false);
};
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
      console.error("사용자 가져오기 오류:", error);
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };

const filteredUsers = users.filter((user) => {
  const nameMatch = user.name?.toLowerCase().includes(searchQuery.toLowerCase());
  const emailMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase());

  // 🔄 전화번호 처리: +8210 → 010 변환 후 비교
  const normalizedPhone = user.phone?.replace(/^\+82/, "0");
  const phoneMatch = normalizedPhone?.includes(searchQuery);

  return nameMatch || emailMatch || phoneMatch;
});

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        navigation.navigate("UserDetailScreen", { userId: item.userId });
      }}
    >
      <View style={styles.profileContainer}>
        {item.idImage ? (
          <Image source={{ uri: item.idImage }} style={styles.profileImage} />
        ) : (
          <Ionicons name="person-circle-outline" size={48} color="#007AFF" />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>역할: {item.role}</Text>
<Text style={styles.userPhone}>
  전화번호: {item.phone?.replace(/^\+82/, "0") || '없음'}
</Text>
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="이름, 이메일 또는 전화번호로 검색"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
         refreshing={refreshing}
  onRefresh={handleRefresh}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            검색된 사용자가 없습니다.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
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
