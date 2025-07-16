import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import API_BASE_URL from "../config/apiConfig";

export default function SelectUserScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("사용자 불러오기 오류:", error);
      Alert.alert("오류", "사용자 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );

  return (
    <FlatList
      data={users}
  keyExtractor={(item) => item.userId}
      contentContainerStyle={{ padding: 20 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => createOrGetChatRoom(item)}
        >
          <Text style={styles.userName}>{item.name} ({item.email})</Text>
        </TouchableOpacity>
      )}
    />
  );

  async function createOrGetChatRoom(user) {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE_URL}/admin/chats/create-or-get`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
body: JSON.stringify({ userId: user.userId })
      });
      const data = await res.json();
      console.log("채팅방 생성 응답:", res.status, data);
      if (!res.ok) throw new Error(data.message || "채팅방 생성 실패");

      navigation.navigate("AdminChatScreen", {
        roomId: data.roomId,
        roomName: user.name,
        roomType: "inquiry",
      });
    } catch (error) {
      console.error("채팅방 생성 오류:", error);
      Alert.alert("오류", "채팅방을 생성할 수 없습니다.");
    }
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  userItem: {
    padding: 15, backgroundColor: "#F8F8F8", borderRadius: 10,
    marginBottom: 10, borderWidth: 1, borderColor: "#ccc"
  },
  userName: { fontSize: 16, color: "#333" }
});
