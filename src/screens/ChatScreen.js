import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_BASE_URL from "../config/apiConfig";
import * as SecureStore from "expo-secure-store";

export default function ChatScreen({ route }) {
  const { roomId, roomType } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const flatListRef = useRef();

  // 메시지 불러오기
  const fetchMessages = async () => {
    try {
      const userId = await SecureStore.getItemAsync("userId");
      const token = await SecureStore.getItemAsync("token");
      if (!userId || !token) return [];
  
      setCurrentUserId(userId);
  
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msgData = await res.json();
  
      // 읽음 처리
      const unreadMessages = msgData.filter(
        (msg) => msg.senderId !== userId && (!msg.readBy || !msg.readBy.includes(userId))
      );
  
      for (const msg of unreadMessages) {
        await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages/${msg.id}/read`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
      }
  
      return msgData;
    } catch (err) {
      console.error("📛 메시지 로딩 실패:", err);
      return [];
    }
  };
  

  useEffect(() => {
    const load = async () => {
      const data = await fetchMessages();
      setMessages(data);
      setLoading(false);
    };
    load();
  }, [roomId]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    const newData = await fetchMessages();
    setMessages(newData);
    setRefreshing(false);
  };
  

  const sendMessage = async () => {
    if (roomType === "notice" || messageText.trim() === "") return;

    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: messageText }),
      });

      if (res.ok) {
        setMessageText("");
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage.data]);
      }
    } catch (error) {
      console.error("📛 메시지 전송 실패:", error);
    }
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.senderId === currentUserId
                ? styles.myMessageBubble
                : styles.otherMessageBubble,
              item.system && styles.systemMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
            {!item.system && (
              <Text style={styles.timestamp}>
                {item.createdAt && item.createdAt._seconds
                  ? new Date(item.createdAt._seconds * 1000).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Seoul",
                    })
                  : ""}
              </Text>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingTop: 15, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />

      {roomType === "notice" ? (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>관리자만 메시지를 보낼 수 있습니다.</Text>
        </View>
      ) : (
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="메시지를 입력하세요..."
            value={messageText}
            onChangeText={setMessageText}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageBubble: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "85%",
  },
  myMessageBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#A3D8FF",
    marginRight: 15,
  },
  otherMessageBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F0F0",
    marginLeft: 15,
  },
  systemMessage: {
    alignSelf: "center",
    backgroundColor: "#e0e0e0",
    marginTop: 10,
  },
  messageText: { fontSize: 16, color: "#333" },
  timestamp: { fontSize: 12, color: "#777", marginTop: 5, textAlign: "right" },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#F1F1F1",
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
  },
  noticeBanner: {
    padding: 15,
    backgroundColor: "#f8d7da",
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  noticeText: {
    color: "#721c24",
    fontSize: 16,
    fontWeight: "bold",
  },
});
