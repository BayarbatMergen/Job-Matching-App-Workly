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
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_BASE_URL from "../config/apiConfig";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";

export default function ChatListScreen({ navigation }) {
  const { t } = useTranslation();

  const [chatRooms, setChatRooms] = useState([]);
  const [unreadRoomIds, setUnreadRoomIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const fetchUnreadStatus = async (uid) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE_URL}/chat/unread-status?userId=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch unread status");

      const data = await res.json();
      const unreadIds = Object.entries(data)
        .filter(([_, isUnread]) => isUnread)
        .map(([roomId]) => roomId);

      setUnreadRoomIds(unreadIds);
    } catch (err) {
      console.error("읽지 않은 상태 불러오기 실패:", err.message);
    }
  };

  const fetchChatRooms = async (uid) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${API_BASE_URL}/chat/rooms?userId=${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const rooms = await response.json();

      const roomsWithTime = await Promise.all(
        rooms.map(async (room) => {
          try {
            const res = await fetch(`${API_BASE_URL}/chat/${room.id}/last-message-time`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            const msgData = await res.json();
            let dateObj = new Date(0);
            if (
              msgData?.lastMessageTime &&
              typeof msgData.lastMessageTime === "string"
            ) {
              dateObj = new Date(msgData.lastMessageTime);
            }

            return { ...room, lastMessageTime: dateObj };
          } catch (err) {
            console.error("Failed to fetch message time:", err.message);
            return { ...room, lastMessageTime: new Date(0) };
          }
        })
      );

      roomsWithTime.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setChatRooms(roomsWithTime);
      await fetchUnreadStatus(uid);
    } catch (error) {
      console.error("채팅방 목록 오류:", error);
      Alert.alert(t("alert.noticeTitle"), t("chat.errorLoadingRooms"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const init = async () => {
    const uid = await SecureStore.getItemAsync("userId");
    if (!uid) {
      Alert.alert(t("alert.loginRequiredTitle"), t("alert.loginRequiredMessage"));
      navigation.replace("Login");
      return;
    }
    setUserId(uid);
    setRefreshing(true);
    try {
      await fetchChatRooms(uid);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const startAdminChat = async () => {
    const token = await SecureStore.getItemAsync("token");

    try {
      const response = await fetch(`${API_BASE_URL}/chat/admin-room`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorHtml = await response.text();
        console.error("관리자 채팅 응답 HTML:", errorHtml);
        Alert.alert(t("alert.noticeTitle"), t("chat.adminChatFail") + "\n" + errorHtml);
        return;
      }

      const result = await response.json();
      navigation.navigate("ChatScreen", {
        roomId: result.roomId,
        roomName: t("chat.withAdmin"),
        roomType: "inquiry",
      });
    } catch (error) {
      console.error("관리자 채팅 오류:", error);
      Alert.alert(t("alert.noticeTitle"), t("chat.networkError"));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <TouchableOpacity style={styles.adminChatButton} onPress={startAdminChat}>
        <Ionicons name="person-circle-outline" size={24} color="#fff" />
        <Text style={styles.adminChatText}>{t("chat.contactAdmin")}</Text>
      </TouchableOpacity>

      {chatRooms.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={init} />}
        >
          <Text style={styles.noChatText}>{t("chat.noRooms")}</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.roomItem}
              onPress={() =>
                navigation.navigate("ChatScreen", {
                  roomId: item.id,
                  roomName: item.name || t("chat.defaultRoomTitle"),
                  roomType: item.roomType || "inquiry",
                })
              }
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#007AFF" />
              <Text style={styles.roomName}>{item.name || t("chat.defaultRoomTitle")}</Text>
              {unreadRoomIds.includes(item.id) && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={init} />}
        />
      )}
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
    marginTop: 10,
    position: "relative",
  },
  roomName: { fontSize: 18, fontWeight: "bold", marginLeft: 10, color: "#333" },
  adminChatButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  adminChatText: { color: "#fff", marginLeft: 8, fontSize: 16, fontWeight: "bold" },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
  },
});
