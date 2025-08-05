import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { db } from '../config/firebase';
import { useTranslation } from 'react-i18next';
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore'; 
import * as SecureStore from 'expo-secure-store';

// 화면 import
import JobListScreen from '../screens/JobListScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import NotificationScreen from '../screens/NotificationScreen';
import MyPageScreen from '../screens/MyPageScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import BankInfoScreen from '../screens/BankInfoScreen';
import NoticeScreen from '../screens/NoticeScreen';
import CustomerSupportScreen from '../screens/CustomerSupportScreen';
import MyInquiriesScreen from '../screens/MyInquiriesScreen';
import ScheduleNavigator from './ScheduleNavigator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const defaultScreenOptions = {
  headerStyle: { backgroundColor: '#007AFF' },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
};

function HomeStack({ hasNotifications }) {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="JobList"
        children={(props) => (
          <JobListScreen {...props} hasNotifications={hasNotifications} />
        )}
        options={({ navigation }) => ({
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('jobList.headerTitle')}
            </Text>
          ),
          headerLeft: () => null,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Notification')}
              style={styles.notificationButton}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {hasNotifications && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('jobList.detailTitle')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('notification.title')}
            </Text>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function ChatNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('chat.listTitle')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={({ route }) => ({
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {route.params?.roomName || t('chat.defaultRoomTitle')}
            </Text>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function MyPageNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="MyPageScreen"
        component={MyPageScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('mypage.title')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="MyInquiriesScreen"
        component={MyInquiriesScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('mypage.inquiries')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('mypage.changePassword')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="BankInfoScreen"
        component={BankInfoScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('mypage.changeBankInfo')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="NoticeScreen"
        component={NoticeScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('mypage.notice')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="CustomerSupportScreen"
        component={CustomerSupportScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('mypage.customerSupport')}
            </Text>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

export default function BottomTabNavigator() {
  const [hasNotifications, setHasNotifications] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let unsubscribePersonal;
    let unsubscribeGlobal;
    let userId = null;

    const setupNotificationListeners = async () => {
      userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      let personalUnread = false;
      let globalUnread = false;

      const personalQuery = query(
        collection(db, `notifications/${userId}/userNotifications`),
        where('read', '==', false)
      );
      unsubscribePersonal = onSnapshot(personalQuery, (snapshot) => {
        personalUnread = snapshot.size > 0;
        updateCombinedStatus();
      });

      const globalQuery = collection(db, 'globalNotifications');
      unsubscribeGlobal = onSnapshot(globalQuery, (snapshot) => {
        globalUnread = false;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.readBy || !data.readBy.includes(userId)) {
            globalUnread = true;
          }
        });
        updateCombinedStatus();
      });

      const updateCombinedStatus = () => {
        setHasNotifications(personalUnread || globalUnread);
      };
    };

    setupNotificationListeners();

    return () => {
      if (unsubscribePersonal) unsubscribePersonal();
      if (unsubscribeGlobal) unsubscribeGlobal();
    };
  }, []);

  useEffect(() => {
    let unsubscribers = [];

    const setupMessageListeners = async () => {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      const chatRoomSnap = await getDocs(
        query(collection(db, 'chats'), where('participants', 'array-contains', userId))
      );
      const roomIds = chatRoomSnap.docs.map((doc) => doc.id);

      if (roomIds.length === 0) return;

      unsubscribers = roomIds.map((roomId) => {
        const msgQuery = collection(db, `chats/${roomId}/messages`);
        return onSnapshot(msgQuery, (snapshot) => {
          let hasUnread = false;
          snapshot.forEach((doc) => {
            const msg = doc.data();
            if (
              msg.senderId !== userId &&
              (!msg.readBy || !msg.readBy.includes(userId))
            ) {
              hasUnread = true;
            }
          });
          setHasUnreadMessages(hasUnread);
        });
      });
    };

    setupMessageListeners();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f8f8f8',
          height: 60,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color }) => {
          const icons = {
            Home: 'briefcase-outline',
            Schedule: 'calendar-outline',
            Chat: 'chatbubble-outline',
            MyPage: 'person-outline',
          };

          return (
            <View style={{ position: 'relative' }}>
              <Ionicons name={icons[route.name]} size={28} color={color} />
              {route.name === 'Chat' && hasUnreadMessages && (
                <View style={styles.notificationDot} />
              )}
              {route.name === 'Home' && hasNotifications && (
                <View style={styles.notificationDot} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeStack hasNotifications={hasNotifications} />}
      </Tab.Screen>
      <Tab.Screen name="Schedule" component={ScheduleNavigator} />
      <Tab.Screen name="Chat" component={ChatNavigator} />
      <Tab.Screen name="MyPage" component={MyPageNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    position: 'relative',
    marginRight: 15,
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 10,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    zIndex: 999,
  },
});
