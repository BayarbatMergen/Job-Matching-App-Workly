import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';

// 화면 import
import AdminJobListScreen from '../screens/AdminJobListScreen';
import AdminJobDetailScreen from '../screens/AdminJobDetailScreen';
import AdminJobFormScreen from '../screens/AdminJobFormScreen';
import AdminScheduleScreen from '../screens/AdminScheduleScreen';
import AdminChatListScreen from '../screens/AdminChatListScreen';
import AdminChatScreen from '../screens/AdminChatScreen';
import AdminMyPageScreen from '../screens/AdminMyPageScreen';
import ApprovalScreen from '../screens/ApprovalScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import NoticeWriteScreen from '../screens/NoticeWriteScreen';
import AdminPasswordChangeScreen from '../screens/AdminPasswordChangeScreen';
import CustomerInquiryScreen from '../screens/CustomerInquiryScreen';
import UserSelectionScreen from '../screens/UserSelectionScreen';
import SettlementApprovalScreen from '../screens/SettlementApprovalScreen';
import AdminNotificationScreen from '../screens/AdminNotificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ 알림 감지 훅
function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('status', '==', 'unread')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      setCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return count;
}

// ✅ 채팅 감지 훅
function useUnreadChatCount() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let unsubscribers = [];

    const listen = async () => {
      const adminId = await SecureStore.getItemAsync("userId");
      if (!adminId) return;

      const roomSnap = await getDocs(
        query(collection(db, "chats"), where("participants", "array-contains", adminId))
      );

      const allRooms = roomSnap.docs;
      if (allRooms.length === 0) {
        setHasUnread(false);
        return;
      }

      const unsubArray = [];
      const unreadMap = {};

      allRooms.forEach((doc) => {
        const roomId = doc.id;
        const messagesRef = collection(db, `chats/${roomId}/messages`);

        const unsub = onSnapshot(messagesRef, (snapshot) => {
          const hasUnreadInRoom = snapshot.docs.some((msgDoc) => {
            const data = msgDoc.data();
            return !(data.readBy || []).includes(adminId);
          });

          unreadMap[roomId] = hasUnreadInRoom;

          const isAnyUnread = Object.values(unreadMap).some(Boolean);
          setHasUnread(isAnyUnread);
        });

        unsubArray.push(unsub);
      });

      unsubscribers = unsubArray;
    };

    listen();
    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  return hasUnread;
}

// 모집 공고 관리 스택
function AdminHomeStack() {
  const unreadCount = useUnreadNotificationCount();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="AdminJobList"
        component={AdminJobListScreen}
        options={({ navigation }) => ({
          headerTitle: '모집 공고',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminNotificationScreen')}
              style={{ marginRight: 15 }}
            >
              <View>
                <Ionicons name="notifications-outline" size={24} color="white" />
                {unreadCount > 0 && <View style={styles.redDot} />}
              </View>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="AdminJobDetail" component={AdminJobDetailScreen} options={{ headerTitle: '공고 상세' }} />
      <Stack.Screen name="AdminJobForm" component={AdminJobFormScreen} options={{ headerTitle: '공고 등록' }} />
      <Stack.Screen name="ApprovalScreen" component={ApprovalScreen} options={{ headerTitle: '승인 대기 목록' }} />
      <Stack.Screen name="UserSelectionScreen" component={UserSelectionScreen} options={{ headerTitle: '사용자 선택' }} />
      <Stack.Screen name="AdminNotificationScreen" component={AdminNotificationScreen} options={{ headerTitle: '알림' }} />
    </Stack.Navigator>
  );
}

// 일정 관리 스택
function AdminScheduleStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center'
    }}>
      <Stack.Screen name="AdminScheduleScreen" component={AdminScheduleScreen} options={{ headerTitle: '일정 관리' }} />
      <Stack.Screen name="SettlementApprovalScreen" component={SettlementApprovalScreen} options={{ headerTitle: '정산 승인 관리' }} />
    </Stack.Navigator>
  );
}

// 채팅 스택
function AdminChatStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center'
    }}>
      <Stack.Screen name="AdminChatList" component={AdminChatListScreen} options={{ headerTitle: '채팅 목록' }} />
      <Stack.Screen name="AdminChatScreen" component={AdminChatScreen} options={({ route }) => ({
        headerTitle: route.params?.roomName || '채팅방'
      })} />
    </Stack.Navigator>
  );
}

// 마이페이지 스택
function AdminMyPageStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center'
    }}>
      <Stack.Screen name="AdminMyPageMain" component={AdminMyPageScreen} options={{ headerTitle: '마이페이지' }} />
      <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} options={{ headerTitle: '전체 사용자 관리' }} />
      <Stack.Screen name="UserDetailScreen" component={UserDetailScreen} options={{ headerTitle: '사용자 상세 정보' }} />
      <Stack.Screen name="NoticeWriteScreen" component={NoticeWriteScreen} options={{ headerTitle: '공지사항 작성' }} />
      <Stack.Screen name="CustomerInquiryScreen" component={CustomerInquiryScreen} options={{ headerTitle: '고객센터 문의 확인' }} />
      <Stack.Screen name="AdminPasswordChangeScreen" component={AdminPasswordChangeScreen} options={{ headerTitle: '비밀번호 변경' }} />
      <Stack.Screen name="AdminNotificationScreen" component={AdminNotificationScreen} options={{ headerTitle: '알림' }} />
    </Stack.Navigator>
  );
}

// ✅ 관리자 바텀 탭 네비게이터
export default function AdminBottomTabNavigator() {
  const hasUnreadChat = useUnreadChatCount();
  const unreadNotificationCount = useUnreadNotificationCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: { backgroundColor: '#f8f8f8', height: 60, paddingBottom: 10 },
        tabBarIcon: ({ color }) => {
          let iconName;
          if (route.name === 'AdminHome') iconName = 'briefcase-outline';
          else if (route.name === 'AdminSchedule') iconName = 'calendar-outline';
          else if (route.name === 'AdminChat') iconName = 'chatbubble-outline';
          else if (route.name === 'AdminMyPage') iconName = 'person-outline';

          const showRedDot =
            (route.name === 'AdminChat' && hasUnreadChat) ||
            (route.name === 'AdminHome' && unreadNotificationCount > 0);

          return (
            <View style={{ position: 'relative' }}>
              <Ionicons name={iconName} size={28} color={color} />
              {showRedDot && <View style={styles.redDot} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminHomeStack} />
      <Tab.Screen name="AdminSchedule" component={AdminScheduleStack} />
      <Tab.Screen name="AdminChat" component={AdminChatStack} />
      <Tab.Screen name="AdminMyPage" component={AdminMyPageStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  redDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    backgroundColor: 'red',
    borderRadius: 4,
  },
});
