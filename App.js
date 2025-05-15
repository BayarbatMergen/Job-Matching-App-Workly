// App.js
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { app } from './src/config/firebase';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';

import { testAsyncStorage } from './src/services/authService';
import { registerForPushNotificationsAsync, sendTestNotification } from './src/utils/notificationService';

// 기본 인증 화면
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ConsentScreen from './src/screens/ConsentScreen';

// 사용자 및 관리자 네비게이션
import AdminBottomTabNavigator from './src/navigation/AdminBottomTabNavigator';

// 관리자 기능
import UserManagementScreen from './src/screens/UserManagementScreen';
import AdminPasswordChangeScreen from './src/screens/AdminPasswordChangeScreen';
import NoticeWriteScreen from './src/screens/NoticeWriteScreen';
import CustomerInquiryScreen from './src/screens/CustomerInquiryScreen';
import NoticeDetailScreen from './src/screens/NoticeDetailScreen';
import ApprovedApplicationsScreen from './src/screens/ApprovedApplicationsScreen';

// 사용자 기능
import BankInfoScreen from './src/screens/BankInfoScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import NoticeScreen from './src/screens/NoticeScreen';
import CustomerSupportScreen from './src/screens/CustomerSupportScreen';

// 채팅
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';

// 일정 관리
import ScheduleNavigator from './src/navigation/ScheduleNavigator';

// 메인
import MainScreen from './src/screens/MainScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // ✅ Firebase Auth 안전 초기화 (Hermes 대응)
    try {
      initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      console.log('Auth already initialized or failed:', e.message);
    }

    testAsyncStorage();

    const setupPush = async () => {
      const userId = await SecureStore.getItemAsync("userId");
      if (userId) {
        await registerForPushNotificationsAsync(userId);
      }

      sendTestNotification("🔥 앱 실행됨", "이건 에뮬레이터 확인용 테스트 알림입니다.");
    };

    setupPush();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 인증 */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="ConsentScreen"
          component={ConsentScreen}
          options={{
            headerShown: true,
            title: '이용약관',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#007AFF',
            headerTitleAlign: 'center',
          }}
        />

        {/* 메인 */}
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="AdminMain" component={AdminBottomTabNavigator} />

        {/* 관리자 기능 */}
        <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} options={{ headerShown: true, title: '사용자 관리' }} />
        <Stack.Screen name="AdminPasswordChangeScreen" component={AdminPasswordChangeScreen} options={{ headerShown: true, title: '비밀번호 변경' }} />
        <Stack.Screen name="NoticeWriteScreen" component={NoticeWriteScreen} options={{ headerShown: true, title: '공지사항 작성' }} />
        <Stack.Screen name="CustomerInquiryScreen" component={CustomerInquiryScreen} options={{ headerShown: true, title: '고객 문의 관리' }} />
        <Stack.Screen name="NoticeDetailScreen" component={NoticeDetailScreen} options={{ headerShown: true, title: '공지사항 상세' }} />
<Stack.Screen
  name="ApprovedApplicationsScreen"
  component={ApprovedApplicationsScreen}
  options={{
    headerShown: true,
    title: '승인 내역 보기',
    headerStyle: { backgroundColor: '#007AFF' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
  }}
/>

        {/* 사용자 기능 */}
        <Stack.Screen name="BankInfo" component={BankInfoScreen} options={{ headerShown: true, title: '계좌 정보 변경' }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: true, title: '비밀번호 변경' }} />
        <Stack.Screen name="Notice" component={NoticeScreen} options={{ headerShown: true, title: '공지사항' }} />
        <Stack.Screen name="CustomerSupport" component={CustomerSupportScreen} options={{ headerShown: true, title: '고객센터 문의' }} />

        {/* 채팅 */}
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: true, title: '채팅방 목록' }} />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route.params?.roomName || '단톡방',
          })}
        />

        {/* 일정 */}
        <Stack.Screen name="Schedule" component={ScheduleNavigator} options={{ headerShown: true, title: '일정 관리' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
