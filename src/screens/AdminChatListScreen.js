import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_BASE_URL from "../config/apiConfig";
import * as SecureStore from "expo-secure-store";
import { Swipeable } from "react-native-gesture-handler";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { RefreshControl } from "react-native";


export default function AdminChatListScreen({ navigation }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [unreadRoomIds, setUnreadRoomIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminChatRooms(); // 기존에 정의된 함수 재활용
    setRefreshing(false);
  };

  const fetchUnreadRooms = async (rooms, adminId) => {
    const unreadRoomIds = [];
    const roomWithLastMessage = [];
  
    for (const room of rooms) {
      const messagesSnap = await getDocs(
        query(
          collection(db, `chats/${room.id}/messages`),
          orderBy("createdAt", "desc"),
          limit(1)
        )
      );
  
      let lastMessageTime = null;
      let hasUnread = false;
  
      if (!messagesSnap.empty) {
        const message = messagesSnap.docs[0].data();
        lastMessageTime = message.createdAt?.toDate();
        hasUnread = !(message.readBy || []).includes(adminId);
      }
  
      if (hasUnread) unreadRoomIds.push(room.id);
  
      roomWithLastMessage.push({
        ...room,
        lastMessageTime: lastMessageTime || new Date(0),
      });
    }
  
    // 정렬
    roomWithLastMessage.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  
    // 정렬된 리스트와 unreadRoomIds를 반환
    return { sortedRooms: roomWithLastMessage, unreadRoomIds };
  };
  
  

  const fetchAdminChatRooms = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const adminId = await SecureStore.getItemAsync("userId");
      if (!token || !adminId) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        navigation.replace("Login");
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/admin/chats/all-rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
  
      const data = await response.json();
      const { sortedRooms, unreadRoomIds } = await fetchUnreadRooms(data, adminId);
  
      setChatRooms(sortedRooms);        // 정렬 반영
      setUnreadRoomIds(unreadRoomIds);  // 도트 표시도 반영
    } catch (error) {
      console.error("채팅방 목록 오류:", error);
      Alert.alert("오류", "채팅방 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };
  

  const deleteChatRoom = async (roomId) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE_URL}/admin/chats/delete-room/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("삭제 실패");

      setChatRooms((prev) => prev.filter((room) => room.id !== roomId));
      setUnreadRoomIds((prev) => prev.filter((id) => id !== roomId));
      Alert.alert(" 삭제 완료", "채팅방이 삭제되었습니다.");
    } catch (error) {
      console.error(" 채팅방 삭제 오류:", error);
      Alert.alert("오류", "채팅방 삭제에 실패했습니다.");
    }
  };

  const confirmDelete = (roomId) => {
    Alert.alert(
      "채팅방 삭제",
      "채팅방을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: () => deleteChatRoom(roomId) },
      ]
    );
  };

  const renderRightActions = (roomId) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => confirmDelete(roomId)}
    >
      <Text style={styles.deleteText}>삭제</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchAdminChatRooms();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        contentContainerStyle={{
          padding: 20,
          flexGrow: 1,
          justifyContent: chatRooms.length === 0 ? 'center' : 'flex-start',
          alignItems: chatRooms.length === 0 ? 'center' : 'stretch',
        }}
        data={chatRooms}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <TouchableOpacity
              style={styles.roomItem}
              onPress={() =>
                navigation.navigate("AdminChatScreen", {
                  roomId: item.id,
                  roomName: item.name || "채팅방",
                  roomType: item.roomType || "inquiry",
                })
              }
              onLongPress={() => confirmDelete(item.id)}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color="#007AFF"
              />
              <Text style={styles.roomName}>{item.name || "채팅방"}</Text>
              {unreadRoomIds.includes(item.id) && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          </Swipeable>
        )}
        ListEmptyComponent={
          <Text style={styles.noChatText}>표시할 채팅방이 없습니다.</Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}  

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#fff", padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noChatText: { fontSize: 18, textAlign: "center", color: "#888", marginTop: 50 },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    position: "relative",
  },
  roomName: { fontSize: 18, fontWeight: "bold", marginLeft: 10, color: "#333" },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 10,
    marginVertical: 5,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    backgroundColor: "red",
    borderRadius: 5,
  },
});