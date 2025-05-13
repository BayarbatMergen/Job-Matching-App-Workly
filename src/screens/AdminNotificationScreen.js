import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { doc, updateDoc } from "firebase/firestore"; // 추가


export default function AdminNotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const newData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(newData);
        setLoading(false);
      },
      error => {
        console.error('알림 불러오기 오류:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={async () => {
        try {
          // 상태를 'read'로 변경
          await updateDoc(doc(db, "notifications", item.id), {
            status: "read",
          });
        } catch (error) {
          console.error("알림 상태 업데이트 실패:", error);
        }
  
        // 알림 타입에 따라 이동
        if (item.type === "settlement") {
          navigation.navigate("AdminSchedule", { screen: "SettlementApprovalScreen" });
        } else if (item.type === "application") {
          navigation.navigate("AdminHome", { screen: "ApprovalScreen" });
        } else if (item.type === "inquiry") {
          navigation.navigate("AdminMyPage", { screen: "CustomerInquiryScreen" });
        } else {
          console.warn("알 수 없는 알림 타입:", item.type);
        }
      }}
      style={styles.notificationItem}
    >
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.time}>
        {item.createdAt?.toDate
          ? item.createdAt.toDate().toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "날짜 없음"}
      </Text>
      {item.status === "unread" && <Text style={styles.badge}>● 새 알림</Text>}
    </TouchableOpacity>
  );
  
  

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  notificationItem: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  message: { fontSize: 15, marginBottom: 6, color: '#333' },
  time: { fontSize: 12, color: '#888' },
  badge: {
    marginTop: 5,
    color: 'red',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
