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
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_BASE_URL from "../config/apiConfig";
import * as SecureStore from "expo-secure-store";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function AdminChatScreen({ route, navigation }) {
  const { roomId, roomName, roomType } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
const [participants, setParticipants] = useState([]);
const [refreshing, setRefreshing] = useState(false);
const [senderMap, setSenderMap] = useState({});
const panResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 60, // 좌우 스와이프 감지
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 50) {
        closeDrawer();
      }
    },
  })
).current;
const handleRefresh = async () => {
  setRefreshing(true);
  setLoading(true);
  try {
    await fetchMessagesAndParticipants();
  } finally {
    setRefreshing(false);
    setLoading(false);
  }
};

  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const flatListRef = useRef();

  useEffect(() => {
    const loadUserIdAndMessages = async () => {
      const userId = await SecureStore.getItemAsync("userId");
      setCurrentUserId(userId);
      if (!userId) return;
  
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;
  
      const msgRes = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const msgData = await msgRes.json();
  
      // 읽지 않은 메시지만 필터
      const unreadMessages = msgData.filter(
        (msg) => !msg.readBy?.includes(userId)
      );
  
      for (const msg of unreadMessages) {
        try {
          await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages/${msg.id}/read`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          });
        } catch (err) {
          console.error(" 읽음 처리 실패:", err);
        }
      }
  
      // 최신 메시지 반영
      setMessages(msgData);
    };
  
    loadUserIdAndMessages();
  }, [roomId]);
   

  useEffect(() => {
    const loadUserId = async () => {
      const userId = await SecureStore.getItemAsync("userId");
      setCurrentUserId(userId);
    };
    loadUserId();

    const fetchMessagesAndParticipants = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) return;
    
        const [msgRes, roomRes] = await Promise.all([
          fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/admin/chats/all-rooms`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
    
        const msgData = await msgRes.json();

// 1. senderMap 먼저 설정
const senderIds = [...new Set(msgData.map(msg => msg.senderId).filter(Boolean))];
const senderInfoPromises = senderIds.map(async (uid) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/user/${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { userId: uid, name: "알 수 없음", role: "알 수 없음" };
    const data = await res.json();
    return { userId: uid, name: data.name || "알 수 없음", role: data.role || "알 수 없음" };
  } catch {
    return { userId: uid, name: "알 수 없음", role: "알 수 없음" };
  }
});

const senderInfoArray = await Promise.all(senderInfoPromises);
const newSenderMap = {};
senderInfoArray.forEach((user) => {
  newSenderMap[user.userId] = {
    name: user.name,
    role: user.role,
  };
});
setSenderMap(newSenderMap);

// 2. senderMap 설정한 후 메시지 저장
setMessages(msgData);
    
        const roomList = await roomRes.json();
        const currentRoom = roomList.find((room) => room.id === roomId);
        const participantIds = currentRoom?.participants || [];

        const namePromises = participantIds.map(async (uid) => {
          try {
const res = await fetch(`${API_BASE_URL}/admin/user/${uid}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              console.warn(` ${uid} 사용자 정보 응답 실패: ${res.status}`);
              return { name: "알 수 없음" };
            }
            const data = await res.json();
            return data;
          } catch (err) {
            console.error(` ${uid} 사용자 정보 가져오기 실패:`, err);
            return { name: "알 수 없음" };
          }
        });
    
const users = await Promise.all(namePromises);
// 기존: setParticipantNames(users.map((user) => user.name || "알 수 없음"))
setParticipants(users.map((user) => ({
  name: user.name || "알 수 없음",
  userId: user.userId,
})));



      } catch (error) {
        console.error(" 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessagesAndParticipants();
  }, [roomId]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

const sendMessage = async () => {
  if (messageText.trim() === "") return;

  try {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(
      `${API_BASE_URL}/chat/rooms/${roomId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: messageText }),
      }
    );

    if (response.ok) {
      setMessageText("");
      const newMessage = await response.json();

      const senderId = newMessage.data.senderId;

      // 🔽 senderMap에 해당 senderId가 없다면 사용자 정보 추가로 불러오기
      if (!senderMap[senderId]) {
        try {
          const userRes = await fetch(`${API_BASE_URL}/admin/user/${senderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            setSenderMap((prev) => ({
              ...prev,
              [senderId]: {
                name: userData.name || "알 수 없음",
                role: userData.role || "user",
              },
            }));
          }
        } catch (err) {
          console.warn("새 메시지 사용자 정보 가져오기 실패:", err);
        }
      }

      setMessages((prev) => [...prev, newMessage.data]);
    }
  } catch (error) {
    console.error("메시지 전송 실패:", error);
  }
};


  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: SCREEN_WIDTH * 0.3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setDrawerVisible(false));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
  >
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={{ flex: 1 }}>
        {/* 상단 바 */}
        <View style={styles.topBar}>
          <Text style={styles.roomTitle}>참여자 {participants.length}명</Text>
          <TouchableOpacity onPress={openDrawer}>
            <Ionicons name="people-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 채팅 목록 */}
<FlatList
  ref={flatListRef}
  data={messages}
  keyExtractor={(item) => item.id}
renderItem={({ item }) => {
  const sender = senderMap[item.senderId] || { name: "알 수 없음", role: "user" };
  const isAdmin = sender.role === "admin";
  const isMine = isAdmin; // 모든 관리자 메시지는 오른쪽

  return (
    <View
      style={[
        styles.messageBubble,
        isMine ? styles.myMessageBubble : styles.otherMessageBubble,
      ]}
    >
      <Text style={styles.senderName}>{sender.name}</Text>
      <Text style={styles.messageText}>{item.text}</Text>
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
    </View>
  );
}}
  contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
  onContentSizeChange={() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }}
  keyboardShouldPersistTaps="handled"
  refreshing={refreshing}
onRefresh={handleRefresh}

/>


        {/* 입력창 */}
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
      </View>

      {/* 참여자 drawer */}
      {drawerVisible && (
<Animated.View
  {...panResponder.panHandlers}
  style={[styles.drawerContainer, { left: drawerAnim }]}>
  <View style={styles.drawerHeader}>
    <Text style={styles.drawerTitle}>참여자 목록</Text>
<TouchableOpacity onPress={closeDrawer} style={{ marginTop: -15}}>
  <Ionicons name="close" size={24} color="#2D85F0" />
</TouchableOpacity>
  </View>
  {participants.map((user, idx) => (
    <TouchableOpacity
      key={idx}
      onPress={() => {
        closeDrawer();
        navigation.push("UserDetailScreen", { userId: user.userId });
      }}
    >
      <Text style={styles.participantItem}>• {user.name}</Text>
    </TouchableOpacity>
  ))}
</Animated.View>
      )}
    </SafeAreaView>
  </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#2D85F0",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },

  messageBubble: {
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
    marginHorizontal: 10,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#D0E7FF",
  },
  otherMessageBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#EDEDED",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  timestamp: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
    textAlign: "right",
  },

  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  chatInput: {
    flex: 1,
    height: 42,
    backgroundColor: "#F1F1F1",
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#2D85F0",
    borderRadius: 20,
  },

  drawerContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderColor: "#ddd",
    padding: 20,
    zIndex: 100,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2D85F0",
  },
  participantItem: {
    fontSize: 16,
    marginVertical: 8,
    color: "#333",
  },
  drawerCloseButton: {
    marginTop: 30,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF2F7",
    borderRadius: 10,
  },
  senderName: {
  fontSize: 13,
  fontWeight: "600",
  color: "#007AFF",
  marginBottom: 2,
},
drawerHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

});
