import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL from '../config/apiConfig';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const fetchNotifications = async () => {
    const uid = await SecureStore.getItemAsync('userId');
    setUserId(uid);
    if (!uid) return;

    try {
      // 개인 알림
      const personalQuery = query(
        collection(db, 'notifications', uid, 'userNotifications'),
        orderBy('createdAt', 'desc')
      );
      const personalSnapshot = await getDocs(personalQuery);
      const personalNotifs = personalSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        source: 'personal',
      }));

      // 글로벌 알림
      const globalQuery = query(
        collection(db, 'globalNotifications'),
        orderBy('createdAt', 'desc')
      );
      const globalSnapshot = await getDocs(globalQuery);
      const globalNotifs = globalSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          source: 'global',
          read: Array.isArray(data.readBy) && data.readBy.includes(uid),

        };
      });

      const combined = [...personalNotifs, ...globalNotifs].sort(
        (a, b) => b.createdAt.seconds - a.createdAt.seconds
      );
      setNotifications(combined);
    } catch (error) {
      console.error('알림 가져오기 오류:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (item) => {
    if (!userId) return;

    if (item.source === 'personal') {
      await updateDoc(doc(db, 'notifications', userId, 'userNotifications', item.id), {
        read: true,
      });
    } else if (item.source === 'global' && !item.read) {
      const token = await SecureStore.getItemAsync('token');
      await fetch(`${API_BASE_URL}/jobs/notifications/global/${item.id}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === item.id && n.source === item.source
          ? { ...n, read: true }
          : n
      )
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        item.source === 'personal' && !item.read && styles.personalUnreadCard,
        item.source === 'personal' && item.read && styles.personalReadCard,
        item.source === 'global' && !item.read && styles.personalUnreadCard,
        item.source === 'global' && item.read && styles.personalReadCard,
      ]}
      onPress={() => {
        if (!item.read) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === item.id && n.source === item.source
                ? { ...n, read: true } // 먼저 읽음 처리
                : n
            )
          );
          markAsRead(item); // 나중에 처리
        }
      }}
    >
      <Ionicons
        name={
          !item.read ? 'notifications' : 'checkmark-done-outline'
        }
        size={24}
        color={!item.read ? '#007AFF' : '#666'}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.message,
            !item.read && styles.personalUnreadText,
            item.read && styles.personalReadText,
          ]}
        >
          {item.message}
        </Text>
        <Text style={styles.time}>
          {item.createdAt?.seconds
            ? new Date(item.createdAt.seconds * 1000).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          alwaysBounceVertical={true}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>알림이 없습니다.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 15 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  personalUnreadCard: { backgroundColor: '#EAF5FF' },
  personalReadCard: { backgroundColor: '#B3D9FF' },
  icon: { marginRight: 12 },
  textContainer: { flex: 1 },
  message: { fontSize: 16 },
  personalUnreadText: { fontWeight: 'bold', color: '#007AFF' },
  personalReadText: { color: '#000000' },
  time: { fontSize: 12, color: '#000000', marginTop: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999', marginTop: 10 },
});
