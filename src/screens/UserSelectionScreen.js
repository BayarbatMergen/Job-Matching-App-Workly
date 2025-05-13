import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import userSelectionStore from "../store/userSelectionStore";

export default function UserSelectionScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const userList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error(" 사용자 가져오기 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedUsers((prev) => [...prev, userId]);
    }
  };

  const handleCompleteSelection = () => {
    userSelectionStore.setSelectedUsers(selectedUsers);
    Alert.alert("선택 완료", `총 ${selectedUsers.length}명의 사용자에게 알림이 전송됩니다.`);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>알림 보낼 사용자 선택</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => toggleSelection(item.id)}
          >
            <Ionicons
              name={
                selectedUsers.includes(item.id)
                  ? "checkbox-outline"
                  : "square-outline"
              }
              size={24}
              color="#007AFF"
            />
            <Text style={styles.userText}>{item.name} ({item.email})</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.completeButton}
        onPress={handleCompleteSelection}
      >
        <Text style={styles.completeButtonText}>선택 완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userText: { marginLeft: 15, fontSize: 16, color: "#333" },
  completeButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  completeButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
